import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Grade Levels (Iran K-12: پایه اول تا دوازدهم)
  const gradeLevels = await Promise.all(
    [
      { name: 'پایه اول', order: 1 },
      { name: 'پایه دوم', order: 2 },
      { name: 'پایه سوم', order: 3 },
      { name: 'پایه چهارم', order: 4 },
      { name: 'پایه پنجم', order: 5 },
      { name: 'پایه ششم', order: 6 },
      { name: 'پایه هفتم', order: 7 },
      { name: 'پایه هشتم', order: 8 },
      { name: 'پایه نهم', order: 9 },
      { name: 'پایه دهم', order: 10 },
      { name: 'پایه یازدهم', order: 11 },
      { name: 'پایه دوازدهم', order: 12 },
    ].map((g) =>
      prisma.gradeLevel.upsert({
        where: { name: g.name },
        update: {},
        create: g,
      })
    )
  );

  // Avatars
  const avatars = await Promise.all([
    prisma.avatar.upsert({
      where: { id: 'avatar-default' },
      update: {},
      create: { id: 'avatar-default', name: 'پیش‌فرض', imageUrl: '/avatars/default.png', cost: 0, isDefault: true },
    }),
    prisma.avatar.upsert({
      where: { id: 'avatar-star' },
      update: {},
      create: { id: 'avatar-star', name: 'ستاره', imageUrl: '/avatars/star.png', cost: 50 },
    }),
    prisma.avatar.upsert({
      where: { id: 'avatar-rocket' },
      update: {},
      create: { id: 'avatar-rocket', name: 'موشک', imageUrl: '/avatars/rocket.png', cost: 100 },
    }),
  ]);

  // Gadgets
  await Promise.all([
    prisma.gadget.upsert({
      where: { id: 'gadget-shield' },
      update: {},
      create: { id: 'gadget-shield', name: 'سپر', description: 'محافظت از امتیاز', imageUrl: '/gadgets/shield.png', cost: 30, effect: 'protect_points' },
    }),
    prisma.gadget.upsert({
      where: { id: 'gadget-boost' },
      update: {},
      create: { id: 'gadget-boost', name: 'تقویت‌کننده', description: 'دو برابر امتیاز', imageUrl: '/gadgets/boost.png', cost: 80, effect: 'double_points' },
    }),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@okidd.ir' },
    update: {},
    create: {
      email: 'admin@okidd.ir',
      password: await hash('Admin1234!'),
      firstName: 'ادمین',
      lastName: 'اوکیدد',
      role: 'ADMIN',
    },
  });

  // School admin user
  const schoolUser = await prisma.user.upsert({
    where: { email: 'school@okidd.ir' },
    update: {},
    create: {
      email: 'school@okidd.ir',
      password: await hash('School1234!'),
      firstName: 'مدیر',
      lastName: 'مدرسه',
      role: 'SCHOOL',
    },
  });

  // School
  const school = await prisma.school.upsert({
    where: { code: 'SCHOOL001' },
    update: {},
    create: {
      name: 'دبستان نمونه',
      code: 'SCHOOL001',
      address: 'تهران، خیابان آزادی',
      adminId: schoolUser.id,
    },
  });

  // Teacher user
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@okidd.ir' },
    update: {},
    create: {
      email: 'teacher@okidd.ir',
      password: await hash('Teacher1234!'),
      firstName: 'علی',
      lastName: 'معلم',
      role: 'TEACHER',
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, schoolId: school.id },
  });

  // Subjects for grade 1
  const grade1 = gradeLevels[0];
  await Promise.all([
    prisma.subject.upsert({
      where: { id: 'subj-math-g1' },
      update: {},
      create: { id: 'subj-math-g1', name: 'ریاضی', gradeLevelId: grade1.id, teacherId: teacher.id },
    }),
    prisma.subject.upsert({
      where: { id: 'subj-farsi-g1' },
      update: {},
      create: { id: 'subj-farsi-g1', name: 'فارسی', gradeLevelId: grade1.id, teacherId: teacher.id },
    }),
    prisma.subject.upsert({
      where: { id: 'subj-science-g1' },
      update: {},
      create: { id: 'subj-science-g1', name: 'علوم', gradeLevelId: grade1.id },
    }),
  ]);

  // Class
  const cls = await prisma.class.upsert({
    where: { id: 'class-1a' },
    update: {},
    create: { id: 'class-1a', name: 'اول الف', schoolId: school.id, gradeLevelId: grade1.id, academicYear: '1403-1404' },
  });

  // Parent user
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@okidd.ir' },
    update: {},
    create: {
      email: 'parent@okidd.ir',
      password: await hash('Parent1234!'),
      firstName: 'احمد',
      lastName: 'والدین',
      role: 'PARENT',
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id },
  });

  // Student user
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@okidd.ir' },
    update: {},
    create: {
      email: 'student@okidd.ir',
      password: await hash('Student1234!'),
      firstName: 'محمد',
      lastName: 'دانش‌آموز',
      role: 'STUDENT',
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      parentId: parent.id,
      gradeLevelId: grade1.id,
      classId: cls.id,
      avatarId: avatars[0].id,
      totalPoints: 100,
    },
  });

  await prisma.studentSchoolHistory.upsert({
    where: { studentId_schoolId_academicYear: { studentId: student.id, schoolId: school.id, academicYear: '1403-1404' } },
    update: {},
    create: { studentId: student.id, schoolId: school.id, academicYear: '1403-1404' },
  });

  // Sample points ledger
  await prisma.pointsLedger.upsert({
    where: { id: 'ledger-seed-1' },
    update: {},
    create: { id: 'ledger-seed-1', studentId: student.id, amount: 100, reason: 'signup_bonus' },
  });

  console.log('Seed completed!');
  console.log('Demo accounts:');
  console.log('  admin@okidd.ir / Admin1234!');
  console.log('  school@okidd.ir / School1234!');
  console.log('  teacher@okidd.ir / Teacher1234!');
  console.log('  parent@okidd.ir / Parent1234!');
  console.log('  student@okidd.ir / Student1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
