import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://okidd.ir';

app.register(fastifyCors, {
  origin: [FRONTEND_URL, /\.railway\.app$/],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'okidd-dev-secret-change-in-production',
});

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import schoolRoutes from './routes/school';
import teacherRoutes from './routes/teacher';
import parentRoutes from './routes/parent';
import studentRoutes from './routes/student';
import sharedRoutes from './routes/shared';

app.register(authRoutes, { prefix: '/api/auth' });
app.register(adminRoutes, { prefix: '/api/admin' });
app.register(schoolRoutes, { prefix: '/api/school' });
app.register(teacherRoutes, { prefix: '/api/teacher' });
app.register(parentRoutes, { prefix: '/api/parent' });
app.register(studentRoutes, { prefix: '/api/student' });
app.register(sharedRoutes, { prefix: '/api' });

app.get('/api/health', async () => ({ status: 'ok', version: '1.0.0' }));

const signals = ['SIGINT', 'SIGTERM'] as const;
signals.forEach((signal) => {
  process.on(signal, async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
});

const start = async () => {
  try {
    await prisma.$connect();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Okidd backend running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
