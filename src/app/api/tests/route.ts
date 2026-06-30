import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.testQuestion.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const question = await prisma.testQuestion.create({
    data: {
      title: body.title,
      dimension: body.dimension,
      options: JSON.stringify(body.options),
      sortOrder: body.sortOrder || 0,
    },
  });
  return NextResponse.json(question);
}
