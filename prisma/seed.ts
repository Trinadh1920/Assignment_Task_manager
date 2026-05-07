import bcrypt from "bcryptjs";
import { PrismaClient, ProjectRole, TaskPriority, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Avery Admin", email: "admin@example.com", passwordHash }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: { name: "Morgan Member", email: "member@example.com", passwordHash }
  });

  const project = await prisma.project.upsert({
    where: { inviteCode: "DEMO-TEAM" },
    update: {},
    create: {
      name: "Demo Product Launch",
      description: "Sample project for local verification and demos.",
      inviteCode: "DEMO-TEAM",
      creatorId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: ProjectRole.ADMIN },
          { userId: member.id, role: ProjectRole.MEMBER }
        ]
      }
    }
  });

  const existing = await prisma.task.count({ where: { projectId: project.id } });
  if (existing === 0) {
    await prisma.task.createMany({
      data: [
        {
          projectId: project.id,
          creatorId: admin.id,
          assigneeId: member.id,
          title: "Finalize onboarding checklist",
          description: "Confirm the launch workflow is ready for the team.",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          priority: TaskPriority.HIGH,
          status: TaskStatus.IN_PROGRESS
        },
        {
          projectId: project.id,
          creatorId: admin.id,
          assigneeId: admin.id,
          title: "Review task metrics",
          description: "Validate dashboard totals before the stakeholder demo.",
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO
        }
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete. Demo users: admin@example.com / member@example.com, password Password123!");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
