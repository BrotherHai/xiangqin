import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import ecr from "../ecr-36.json";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.admin.findUnique({ where: { email: "admin@xiangqin.com" } });
  if (!admin) {
    const password = await hash("admin123", 12);
    await prisma.admin.create({
      data: { email: "admin@xiangqin.com", name: "管理员", password },
    });
    console.log("Admin user created: admin@xiangqin.com / admin123");
  } else {
    console.log("Admin already exists");
  }

  const existing = await prisma.testQuestion.count();
  if (existing > 0) {
    console.log(`Test questions already seeded (${existing})`);
    return;
  }

  const avoidItems = new Set(ecr.scoring.avoidance.items as number[]);
  const options = JSON.stringify(
    ecr.scaleLabels.map((label, i) => ({ score: i + 1, text: label || String(i + 1) }))
  );

  await prisma.testQuestion.createMany({
    data: ecr.questions.map((q) => ({
      title: q.text,
      dimension: avoidItems.has(q.id) ? "回避" : "焦虑",
      options,
      sortOrder: q.id,
    })),
  });
  console.log(`Seeded ${ecr.questions.length} ECR-36 questions`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
