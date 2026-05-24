import { prisma } from '../index';

export async function addPoints(
  studentId: string,
  amount: number,
  reason: string,
  refType?: string,
  refId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.pointsLedger.create({ data: { studentId, amount, reason, refType, refId } }),
    prisma.student.update({ where: { id: studentId }, data: { totalPoints: { increment: amount } } }),
  ]);
}

export async function deductPoints(
  studentId: string,
  amount: number,
  reason: string,
  refType?: string,
  refId?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.pointsLedger.create({ data: { studentId, amount: -amount, reason, refType, refId } }),
    prisma.student.update({ where: { id: studentId }, data: { totalPoints: { decrement: amount } } }),
  ]);
}

export async function getPointsTotal(studentId: string): Promise<number> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { totalPoints: true } });
  return student?.totalPoints ?? 0;
}
