import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const introductions = await prisma.introduction.findMany({
    include: {
      givenBy: true,
      receivedBy: true,
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(introductions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { givenById, receivedById, message } = await req.json();
  const introduction = await prisma.introduction.create({
    data: {
      givenById,
      receivedById,
      adminId: (session.user as any).id,
      message: message || null,
    },
  });
  return NextResponse.json(introduction);
}
