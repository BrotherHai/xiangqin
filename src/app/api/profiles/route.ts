import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status } : {};
  const profiles = await prisma.profile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { testAnswers: true } } },
  });
  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await prisma.profile.create({
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
