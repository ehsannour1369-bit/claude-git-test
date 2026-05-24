import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole, JwtPayload } from '../middleware/auth';
import { addPoints } from '../services/points';

const teacherOnly = requireRole('TEACHER');

export default async function teacherRoutes(app: FastifyInstance) {
  // Get teacher profile
  app.get('/me', { preHandler: teacherOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        school: true,
        subjects: { include: { gradeLevel: true } },
      },
    });
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' });
    return reply.send({ data: teacher });
  });

  // Subjects
  app.get('/subjects', { preHandler: teacherOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' });

    const subjects = await prisma.subject.findMany({
      where: { teacherId: teacher.id },
      include: { gradeLevel: true, _count: { select: { assignments: true } } },
    });
    return reply.send({ data: subjects });
  });

  // Assignments
  app.get('/assignments', { preHandler: teacherOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' });

    const subjects = await prisma.subject.findMany({ where: { teacherId: teacher.id }, select: { id: true } });
    const subjectIds = subjects.map((s) => s.id);

    const assignments = await prisma.assignment.findMany({
      where: { subjectId: { in: subjectIds } },
      include: { subject: { include: { gradeLevel: true } }, _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: assignments });
  });

  app.post('/assignments', { preHandler: teacherOnly }, async (request, reply) => {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      subjectId: z.string().min(1),
      dueDate: z.string().datetime().optional(),
      maxPoints: z.number().int().min(1).default(100),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { userId } = request.user as JwtPayload;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' });

    const subject = await prisma.subject.findFirst({ where: { id: body.data.subjectId, teacherId: teacher.id } });
    if (!subject) return reply.status(403).send({ error: 'Subject not assigned to you' });

    const assignment = await prisma.assignment.create({
      data: {
        title: body.data.title,
        description: body.data.description,
        subjectId: body.data.subjectId,
        dueDate: body.data.dueDate ? new Date(body.data.dueDate) : null,
        maxPoints: body.data.maxPoints,
      },
      include: { subject: { include: { gradeLevel: true } } },
    });
    return reply.status(201).send({ data: assignment });
  });

  // Submissions
  app.get('/assignments/:id/submissions', { preHandler: teacherOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    });
    return reply.send({ data: submissions });
  });

  app.patch('/submissions/:id/grade', { preHandler: teacherOnly }, async (request, reply) => {
    const schema = z.object({ score: z.number().int().min(0), feedback: z.string().optional() });
    const { id } = request.params as { id: string };
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { assignment: true },
    });
    if (!submission) return reply.status(404).send({ error: 'Submission not found' });

    const updated = await prisma.submission.update({
      where: { id },
      data: { score: body.data.score, feedback: body.data.feedback },
    });

    // Award points based on score percentage
    const percentage = (body.data.score / submission.assignment.maxPoints) * 100;
    if (percentage >= 60) {
      const pts = Math.round(percentage / 10);
      await addPoints(submission.studentId, pts, 'assignment_grade', 'Submission', id);
    }

    return reply.send({ data: updated });
  });

  // Students in teacher's school
  app.get('/students', { preHandler: teacherOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' });

    const students = await prisma.studentSchoolHistory.findMany({
      where: { schoolId: teacher.schoolId },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            gradeLevel: true,
            class: true,
          },
        },
      },
    });
    return reply.send({ data: students.map((s) => s.student) });
  });
}
