import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const area = searchParams.get("area");

  const where: any = { status: "approved" };
  if (gender) where.gender = gender;
  if (minAge || maxAge) {
    where.age = {};
    if (minAge) where.age.gte = parseInt(minAge);
    if (maxAge) where.age.lte = parseInt(maxAge);
  }
  if (area) where.area = { contains: area };

  const profiles = await prisma.profile.findMany({
    where,
    include: { testAnswers: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
}
