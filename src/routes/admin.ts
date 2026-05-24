import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../index';
import { requireRole, JwtPayload } from '../middleware/auth';

const adminOnly = requireRole('ADMIN');

export default async function adminRoutes(app: FastifyInstance) {
  // Grade Levels
  app.get('/grade-levels', { preHandler: adminOnly }, async (_request, reply) => {
    const levels = await prisma.gradeLevel.findMany({ orderBy: { order: 'asc' } });
    return reply.send({ data: levels });
  });

  app.post('/grade-levels', { preHandler: adminOnly }, async (request, reply) => {
    const schema = z.object({ name: z.string().min(1), order: z.number().int().min(1) });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const level = await prisma.gradeLevel.create({ data: body.data });
    return reply.status(201).send({ data: level });
  });

  app.put('/grade-levels/:id', { preHandler: adminOnly }, async (request, reply) => {
    const schema = z.object({ name: z.string().min(1).optional(), order: z.number().int().min(1).optional() });
    const { id } = request.params as { id: string };
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const level = await prisma.gradeLevel.update({ where: { id }, data: body.data });
    return reply.send({ data: level });
  });

  app.delete('/grade-levels/:id', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.gradeLevel.delete({ where: { id } });
    return reply.send({ data: { message: 'Grade level deleted' } });
  });

  // Schools
  app.get('/schools', { preHandler: adminOnly }, async (_request, reply) => {
    const schools = await prisma.school.findMany({
      include: { admin: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    return reply.send({ data: schools });
  });

  app.post('/schools', { preHandler: adminOnly }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      code: z.string().min(1),
      address: z.string().optional(),
      phone: z.string().optional(),
      adminEmail: z.string().email(),
      adminPassword: z.string().min(8),
      adminFirstName: z.string().min(1),
      adminLastName: z.string().min(1),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const { adminEmail, adminPassword, adminFirstName, adminLastName, ...schoolData } = body.data;

    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) return reply.status(409).send({ error: 'Admin email already in use' });

    const hashed = await bcrypt.hash(adminPassword, 12);
    const school = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: { email: adminEmail, password: hashed, firstName: adminFirstName, lastName: adminLastName, role: 'SCHOOL' },
      });
      return tx.school.create({
        data: { ...schoolData, adminId: admin.id },
        include: { admin: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });
    });

    return reply.status(201).send({ data: school });
  });

  app.patch('/schools/:id/toggle', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return reply.status(404).send({ error: 'School not found' });

    const updated = await prisma.school.update({ where: { id }, data: { isActive: !school.isActive } });
    return reply.send({ data: updated });
  });

  // Users
  app.get('/users', { preHandler: adminOnly }, async (request, reply) => {
    const query = request.query as { role?: string; page?: string; limit?: string };
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where = query.role ? { role: query.role as 'ADMIN' | 'SCHOOL' | 'TEACHER' | 'PARENT' | 'STUDENT' } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    return reply.send({ data: { users, total, page, limit } });
  });

  app.patch('/users/:id/toggle', { preHandler: adminOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: { id: true, email: true, isActive: true } });
    return reply.send({ data: updated });
  });

  // Stats
  app.get('/stats', { preHandler: adminOnly }, async (_request, reply) => {
    const [schools, teachers, students, parents] = await Promise.all([
      prisma.school.count({ where: { isActive: true } }),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.parent.count(),
    ]);
    return reply.send({ data: { schools, teachers, students, parents } });
  });
}
