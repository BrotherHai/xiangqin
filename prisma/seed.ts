import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

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
}

main().catch(console.error).finally(() => prisma.$disconnect());
