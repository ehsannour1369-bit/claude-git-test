import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

export default async function sharedRoutes(app: FastifyInstance) {
  // Avatars — public list
  app.get('/avatars', async (_request, reply) => {
    const avatars = await prisma.avatar.findMany({ orderBy: { cost: 'asc' } });
    return reply.send({ data: avatars });
  });

  // Gadgets — public list
  app.get('/gadgets', async (_request, reply) => {
    const gadgets = await prisma.gadget.findMany({ orderBy: { cost: 'asc' } });
    return reply.send({ data: gadgets });
  });

  // Grade levels — public
  app.get('/grade-levels', async (_request, reply) => {
    const levels = await prisma.gradeLevel.findMany({ orderBy: { order: 'asc' } });
    return reply.send({ data: levels });
  });

  // Leaderboard
  app.get('/leaderboard', { preHandler: authenticate }, async (request, reply) => {
    const query = request.query as { limit?: string };
    const limit = Math.min(parseInt(query.limit || '10'), 50);

    const students = await prisma.student.findMany({
      orderBy: { totalPoints: 'desc' },
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true } },
        avatar: { select: { name: true, imageUrl: true } },
        gradeLevel: { select: { name: true } },
      },
    });

    const data = students.map((s, i) => ({
      rank: i + 1,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      totalPoints: s.totalPoints,
      avatar: s.avatar,
      gradeLevel: s.gradeLevel?.name,
    }));
    return reply.send({ data });
  });

  // Admin: create avatar
  app.post('/admin/avatars', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      imageUrl: z.string().url(),
      cost: z.number().int().min(0).default(0),
      isDefault: z.boolean().default(false),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const avatar = await prisma.avatar.create({ data: body.data });
    return reply.status(201).send({ data: avatar });
  });

  // Admin: create gadget
  app.post('/admin/gadgets', { preHandler: requireRole('ADMIN') }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().url(),
      cost: z.number().int().min(0).default(0),
      effect: z.string().optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.errors });

    const gadget = await prisma.gadget.create({ data: body.data });
    return reply.status(201).send({ data: gadget });
  });
}
