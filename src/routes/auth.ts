import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, JwtPayload } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.errors });
    }

    const { email, password, firstName, lastName, phone } = body.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, firstName, lastName, phone, role: 'STUDENT' },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });

    return reply.status(201).send({ data: user });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.errors });
    }

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const token = app.jwt.sign(payload, { expiresIn: '7d' });

    return reply.send({
      data: {
        token,
        user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      },
    });
  });

  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, createdAt: true },
    });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    return reply.send({ data: user });
  });

  app.post('/change-password', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.errors });
    }

    const { userId } = request.user as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const valid = await bcrypt.compare(body.data.currentPassword, user.password);
    if (!valid) return reply.status(401).send({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(body.data.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return reply.send({ data: { message: 'Password updated successfully' } });
  });
}
