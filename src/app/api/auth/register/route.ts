import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "管理员已存在" }, { status: 400 });
    }
    const hashed = await hash(password, 12);
    const admin = await prisma.admin.create({
      data: { email, name, password: hashed },
    });
    return NextResponse.json({ id: admin.id, email: admin.email, name: admin.name });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
