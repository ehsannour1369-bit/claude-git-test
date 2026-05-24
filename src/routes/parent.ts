import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { requireRole, JwtPayload } from '../middleware/auth';
import { getReport } from '../services/reports';

const parentOnly = requireRole('PARENT');

export default async function parentRoutes(app: FastifyInstance) {
  // Get parent profile
  app.get('/me', { preHandler: parentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const parent = await prisma.parent.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        students: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            gradeLevel: true,
            class: true,
          },
        },
      },
    });
    if (!parent) return reply.status(404).send({ error: 'Parent not found' });
    return reply.send({ data: parent });
  });

  // List children
  app.get('/children', { preHandler: parentOnly }, async (request, reply) => {
    const { userId } = request.user as JwtPayload;
    const parent = await prisma.parent.findUnique({ where: { userId } });
    if (!parent) return reply.status(404).send({ error: 'Parent not found' });

    const students = await prisma.student.findMany({
      where: { parentId: parent.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        gradeLevel: true,
        class: true,
        avatar: true,
      },
    });
    return reply.send({ data: students });
  });

  // Child progress
  app.get('/children/:id/progress', { preHandler: parentOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const parent = await prisma.parent.findUnique({ where: { userId } });
    if (!parent) return reply.status(404).send({ error: 'Parent not found' });

    const student = await prisma.student.findFirst({ where: { id, parentId: parent.id } });
    if (!student) return reply.status(404).send({ error: 'Student not found or not your child' });

    const report = await getReport(id);
    return reply.send({ data: report });
  });

  // Child points history
  app.get('/children/:id/points', { preHandler: parentOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const parent = await prisma.parent.findUnique({ where: { userId } });
    if (!parent) return reply.status(404).send({ error: 'Parent not found' });

    const student = await prisma.student.findFirst({ where: { id, parentId: parent.id } });
    if (!student) return reply.status(404).send({ error: 'Student not found or not your child' });

    const [ledger, total] = await Promise.all([
      prisma.pointsLedger.findMany({
        where: { studentId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.student.findUnique({ where: { id }, select: { totalPoints: true } }),
    ]);
    return reply.send({ data: { ledger, totalPoints: total?.totalPoints ?? 0 } });
  });

  // Child submissions
  app.get('/children/:id/submissions', { preHandler: parentOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.user as JwtPayload;
    const parent = await prisma.parent.findUnique({ where: { userId } });
    if (!parent) return reply.status(404).send({ error: 'Parent not found' });

    const student = await prisma.student.findFirst({ where: { id, parentId: parent.id } });
    if (!student) return reply.status(404).send({ error: 'Student not found or not your child' });

    const submissions = await prisma.submission.findMany({
      where: { studentId: id },
      include: { assignment: { include: { subject: { include: { gradeLevel: true } } } } },
      orderBy: { submittedAt: 'desc' },
    });
    return reply.send({ data: submissions });
  });
}
