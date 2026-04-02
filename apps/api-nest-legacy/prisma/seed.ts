import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@habbit-runner.local';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL
    }
  });

  const habit = await prisma.habit.upsert({
    where: { id: 'demo-habit-1' },
    update: {
      updatedAt: new Date(),
      version: 1
    },
    create: {
      id: 'demo-habit-1',
      userId: user.id,
      name: 'Deep Work',
      description: '2 hours of focused, distraction-free work',
      color: 'blue',
      icon: '⚡',
      frequency: 'daily',
      schedule: { type: 'daily' },
      targetStreak: 30,
      tags: ['productivity', 'focus'],
      archived: false,
      version: 1
    }
  });

  const habit2 = await prisma.habit.upsert({
    where: { id: 'demo-habit-2' },
    update: {
      updatedAt: new Date(),
      version: 1
    },
    create: {
      id: 'demo-habit-2',
      userId: user.id,
      name: 'Move Every Day',
      description: '30 minute movement or workout',
      color: 'green',
      icon: '🏃',
      frequency: 'daily',
      schedule: { type: 'daily' },
      targetStreak: 21,
      tags: ['health'],
      archived: false,
      version: 1
    }
  });

  const seeds = [
    { habitId: habit.id, done: true },
    { habitId: habit.id, done: true },
    { habitId: habit2.id, done: true }
  ];

  for (let i = 0; i < seeds.length; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    await prisma.checkin.upsert({
      where: {
        habit_date_unique: {
          habitId: seeds[i].habitId,
          date
        }
      },
      update: {
        done: seeds[i].done,
        updatedAt: new Date(),
        version: 1
      },
      create: {
        id: `demo-checkin-${i}`,
        userId: user.id,
        habitId: seeds[i].habitId,
        date,
        done: seeds[i].done,
        version: 1
      }
    });
  }

  process.stdout.write(`Seed data ready for demo user: ${user.email}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
