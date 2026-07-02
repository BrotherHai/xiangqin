import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseJson, parseAge, asString, jsonError } from "@/lib/validate";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
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
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAdmin();
  if (error) return error;
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

  const profile = await prisma.profile.create({
    data: {
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
    },
  });
  return NextResponse.json(profile);
}
