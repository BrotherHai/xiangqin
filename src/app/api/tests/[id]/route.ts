import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const question = await prisma.testQuestion.update({
    where: { id },
    data: {
      title: body.title,
      dimension: body.dimension,
      options: JSON.stringify(body.options),
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.testQuestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
