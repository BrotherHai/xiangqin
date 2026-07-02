import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { parseJson, asString, jsonError } from "@/lib/validate";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  const questions = await prisma.testQuestion.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAdmin();
  if (error) return error;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;

  const title = asString(body.title);
  const dimension = asString(body.dimension);
  if (!title || !dimension) return jsonError("缺少题目标题或维度", 422);

  const question = await prisma.testQuestion.create({
    data: {
      title,
      dimension,
      options: JSON.stringify(Array.isArray(body.options) ? body.options : []),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder) || 0,
    },
  });
  return NextResponse.json(question);
}
