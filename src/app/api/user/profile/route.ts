import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { getDashboardData } from "@/lib/dashboard-data";
import { parseJson, parseAge, asString, jsonError } from "@/lib/validate";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;
  const data = await getDashboardData(session!.user.id);
  if (!data) return NextResponse.json(null);
  // getDashboardData returns only { name, phone, profile, ecr, mbti } — never
  // the password hash (the previous implementation spread the whole user).
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireUser();
  if (error) return error;
  const userId = session!.user.id;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;

  const age = parseAge(body.age);
  if (age === null) return jsonError("请填写有效年龄", 422);
  const name = asString(body.name);
  const gender = asString(body.gender);
  const area = asString(body.area);
  const occupation = asString(body.occupation);
  const requirement = asString(body.requirement);
  if (!name || !gender || !area || !occupation || !requirement) {
    return jsonError("缺少必填字段", 422);
  }

  const data = {
    name,
    gender,
    age,
    area,
    occupation,
    photos: JSON.stringify(Array.isArray(body.photos) ? body.photos : []),
    wechat: asString(body.wechat) ?? null,
    phone: asString(body.phone) ?? null,
    requirement,
    background: asString(body.background) ?? null,
    expectMinAge: parseAge(body.expectMinAge),
    expectMaxAge: parseAge(body.expectMaxAge),
    expectArea: asString(body.expectArea) ?? null,
  };

  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    const profile = await prisma.profile.update({
      where: { id: existing.id },
      data: { ...data, status: "pending" },
    });
    return NextResponse.json(profile);
  }

  const profile = await prisma.profile.create({
    data: { ...data, userId },
  });
  return NextResponse.json(profile);
}
