import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole, JwtPayload } from '../middleware/auth';
import { addPoints } from '../services/points';
import { getReport } from '../services/reports';

const studentOnly = requireRole('STUDENT');

export default async function studentRoutes(app: FastifyInstance) {
  // Profile
  app.get('/me', { preHandler: studentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        gradeLevel: true,
        class: true,
        avatar: true,
        gadgets: { include: { gadget: true } },
      },
    });
    if (!student) return reply.status(404).send({ error: 'Student not found' });
    return reply.send({ data: student });
  });

  // Assignments for student
  app.get('/assignments', { preHandler: studentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const subjects = student.gradeLevelId
      ? await prisma.subject.findMany({ where: { gradeLevelId: student.gradeLevelId }, select: { id: true } })
      : [];
    const subjectIds = subjects.map((s) => s.id);

    const assignments = await prisma.assignment.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        subject: { include: { gradeLevel: true, teacher: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        submissions: { where: { studentId: student.id }, select: { id: true, score: true, submittedAt: true, feedback: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: assignments });
  });

  // Submit assignment
  app.post('/assignments/:id/submit', { preHandler: studentOnly }, async (request, reply) => {
    const schema = z.object({ content: z.string().min(1) });
    const { id } = request.params as { id: string };
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
    });
    if (existing) return reply.status(409).send({ error: 'Already submitted' });

    const submission = await prisma.submission.create({
      data: { assignmentId: id, studentId: student.id, content: body.data.content },
    });

    // Award points for submitting
    await addPoints(student.id, 5, 'assignment_submit', 'Assignment', id);

    return reply.status(201).send({ data: submission });
  });

  // Points
  app.get('/points', { preHandler: studentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const [ledger, s] = await Promise.all([
      prisma.pointsLedger.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.student.findUnique({ where: { id: student.id }, select: { totalPoints: true } }),
    ]);
    return reply.send({ data: { ledger, totalPoints: s?.totalPoints ?? 0 } });
  });

  // Report
  app.get('/report', { preHandler: studentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const report = await getReport(student.id);
    return reply.send({ data: report });
  });

  // Buy avatar
  app.post('/avatar/:id/buy', { preHandler: studentOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const avatar = await prisma.avatar.findUnique({ where: { id } });
    if (!avatar) return reply.status(404).send({ error: 'Avatar not found' });

    if (student.totalPoints < avatar.cost) {
      return reply.status(400).send({ error: 'Insufficient points' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.update({ where: { id: student.id }, data: { avatarId: id, totalPoints: { decrement: avatar.cost } } });
      if (avatar.cost > 0) {
        await tx.pointsLedger.create({ data: { studentId: student.id, amount: -avatar.cost, reason: 'avatar_purchase', refType: 'Avatar', refId: id } });
      }
    });

    return reply.send({ data: { message: 'Avatar equipped' } });
  });

  // Buy gadget
  app.post('/gadget/:id/buy', { preHandler: studentOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const gadget = await prisma.gadget.findUnique({ where: { id } });
    if (!gadget) return reply.status(404).send({ error: 'Gadget not found' });

    const owned = await prisma.studentGadget.findUnique({ where: { studentId_gadgetId: { studentId: student.id, gadgetId: id } } });
    if (owned) return reply.status(409).send({ error: 'Gadget already owned' });

    if (student.totalPoints < gadget.cost) return reply.status(400).send({ error: 'Insufficient points' });

    await prisma.$transaction(async (tx) => {
      await tx.studentGadget.create({ data: { studentId: student.id, gadgetId: id } });
      await tx.student.update({ where: { id: student.id }, data: { totalPoints: { decrement: gadget.cost } } });
      if (gadget.cost > 0) {
        await tx.pointsLedger.create({ data: { studentId: student.id, amount: -gadget.cost, reason: 'gadget_purchase', refType: 'Gadget', refId: id } });
      }
    });

    return reply.send({ data: { message: 'Gadget purchased' } });
  });
}
