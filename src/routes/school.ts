import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole, JwtPayload } from '../middleware/auth';

const schoolOnly = requireRole('SCHOOL');

export default async function schoolRoutes(app: FastifyInstance) {
  // Get own school info
  app.get('/me', { preHandler: schoolOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({
      where: { adminId: userId },
      include: { admin: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!school) return reply.status(404).send({ error: 'School not found' });
    return reply.send({ data: school });
  });

  // Classes
  app.get('/classes', { preHandler: schoolOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      include: { gradeLevel: true, _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: classes });
  });

  app.post('/classes', { preHandler: schoolOnly }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      gradeLevelId: z.string().min(1),
      academicYear: z.string().min(1),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const cls = await prisma.class.create({
      data: { ...body.data, schoolId: school.id },
      include: { gradeLevel: true },
    });
    return reply.status(201).send({ data: cls });
  });

  app.delete('/classes/:id', { preHandler: schoolOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const cls = await prisma.class.findFirst({ where: { id, schoolId: school.id } });
    if (!cls) return reply.status(404).send({ error: 'Class not found' });

    await prisma.class.delete({ where: { id } });
    return reply.send({ data: { message: 'Class deleted' } });
  });

  // Teachers
  app.get('/teachers', { preHandler: schoolOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const teachers = await prisma.teacher.findMany({
      where: { schoolId: school.id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true } }, subjects: { include: { gradeLevel: true } } },
    });
    return reply.send({ data: teachers });
  });

  app.post('/teachers', { preHandler: schoolOnly }, async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) return reply.status(409).send({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(body.data.password, 12);
    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: body.data.email, password: hashed, firstName: body.data.firstName, lastName: body.data.lastName, phone: body.data.phone, role: 'TEACHER' },
      });
      return tx.teacher.create({
        data: { userId: user.id, schoolId: school.id },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });
    });

    return reply.status(201).send({ data: teacher });
  });

  // Students
  app.get('/students', { preHandler: schoolOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const students = await prisma.studentSchoolHistory.findMany({
      where: { schoolId: school.id },
      include: {
        student: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
            gradeLevel: true,
            class: true,
          },
        },
      },
    });
    return reply.send({ data: students.map((s) => s.student) });
  });

  app.post('/students', { preHandler: schoolOnly }, async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      gradeLevelId: z.string().optional(),
      classId: z.string().optional(),
      academicYear: z.string().min(1),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) return reply.status(409).send({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(body.data.password, 12);
    const { academicYear, email, password: _pwd, firstName, lastName, phone, gradeLevelId, classId } = body.data;

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashed, firstName, lastName, phone, role: 'STUDENT' },
      });
      const s = await tx.student.create({
        data: { userId: user.id, gradeLevelId, classId },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });
      await tx.studentSchoolHistory.upsert({
        where: { studentId_schoolId_academicYear: { studentId: s.id, schoolId: school.id, academicYear } },
        create: { studentId: s.id, schoolId: school.id, academicYear },
        update: {},
      });
      return s;
    });

    return reply.status(201).send({ data: student });
  });

  // Stats
  app.get('/stats', { preHandler: schoolOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const school = await prisma.school.findUnique({ where: { adminId: userId } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const [teachers, students, classes] = await Promise.all([
      prisma.teacher.count({ where: { schoolId: school.id } }),
      prisma.studentSchoolHistory.count({ where: { schoolId: school.id } }),
      prisma.class.count({ where: { schoolId: school.id } }),
    ]);
    return reply.send({ data: { teachers, students, classes } });
  });
}
