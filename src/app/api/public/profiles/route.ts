import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  const userId = session ? (session.user as any).id : null;
  const userRole = session ? (session.user as any).role : null;
  const existingProfile = userRole === "user" && userId
    ? await prisma.profile.findUnique({ where: { userId } })
    : null;

  if (existingProfile) {
    const profile = await prisma.profile.update({
      where: { id: existingProfile.id },
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
        status: "pending",
      },
    });
    return NextResponse.json(profile);
  }

  const profile = await prisma.profile.create({
    data: {
      userId: userRole === "user" ? userId : null,
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
      referrerName: "本人",
      referrerRelation: "本人",
    },
  });
  return NextResponse.json(profile);
}
