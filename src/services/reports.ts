import { prisma } from '../index';

interface SubjectReport {
  subjectId: string;
  subjectName: string;
  totalAssignments: number;
  submitted: number;
  avgScore: number | null;
  strength: boolean;
  weakness: boolean;
}

interface StudentReport {
  studentId: string;
  totalPoints: number;
  totalAssignments: number;
  submitted: number;
  submissionRate: number;
  avgScore: number | null;
  subjects: SubjectReport[];
  strengths: string[];
  weaknesses: string[];
}

export async function getReport(studentId: string): Promise<StudentReport> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gradeLevel: true },
  });

  if (!student) throw new Error('Student not found');

  const subjects = student.gradeLevelId
    ? await prisma.subject.findMany({
        where: { gradeLevelId: student.gradeLevelId },
        include: {
          assignments: {
            include: { submissions: { where: { studentId } } },
          },
        },
      })
    : [];

  const subjectReports: SubjectReport[] = subjects.map((subject) => {
    const assignments = subject.assignments;
    const submitted = assignments.filter((a) => a.submissions.length > 0);
    const scores = submitted
      .map((a) => a.submissions[0]?.score)
      .filter((s): s is number => s !== null && s !== undefined);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalAssignments: assignments.length,
      submitted: submitted.length,
      avgScore: avgScore !== null ? Math.round(avgScore) : null,
      strength: avgScore !== null && avgScore >= 80,
      weakness: avgScore !== null && avgScore < 60,
    };
  });

  const allAssignments = subjectReports.reduce((a, s) => a + s.totalAssignments, 0);
  const allSubmitted = subjectReports.reduce((a, s) => a + s.submitted, 0);
  const allScores = subjectReports.filter((s) => s.avgScore !== null).map((s) => s.avgScore as number);
  const overallAvg = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  return {
    studentId,
    totalPoints: student.totalPoints,
    totalAssignments: allAssignments,
    submitted: allSubmitted,
    submissionRate: allAssignments > 0 ? Math.round((allSubmitted / allAssignments) * 100) : 0,
    avgScore: overallAvg,
    subjects: subjectReports,
    strengths: subjectReports.filter((s) => s.strength).map((s) => s.subjectName),
    weaknesses: subjectReports.filter((s) => s.weakness).map((s) => s.subjectName),
  };
}
