import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { testAnswers: { include: { question: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await prisma.profile.update({
    where: { id },
    data: {
      name: body.name,
      gender: body.gender,
      age: parseInt(body.age),
      area: body.area,
      occupation: body.occupation,
      photos: JSON.stringify(body.photos || []),
      wechat: body.wechat || null,
      phone: body.phone || null,
      requirement: body.requirement,
      background: body.background || null,
      referrerName: body.referrerName,
      referrerRelation: body.referrerRelation,
    },
  });
  return NextResponse.json(profile);
}
