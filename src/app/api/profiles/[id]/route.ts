import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseJson, parseAge, asString, jsonError } from "@/lib/validate";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { testAnswers: { include: { question: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
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

  const profile = await prisma.profile.update({
    where: { id },
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
