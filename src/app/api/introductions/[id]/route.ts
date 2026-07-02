import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseJson, jsonError } from "@/lib/validate";
import { computeIntroStatus, isPartyStatus, type IntroPartyStatus } from "@/lib/introduction-status";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;

  const existing = await prisma.introduction.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const givenByStatus: IntroPartyStatus = isPartyStatus(body.givenByStatus) ? body.givenByStatus : (existing.givenByStatus as IntroPartyStatus);
  const receivedByStatus: IntroPartyStatus = isPartyStatus(body.receivedByStatus) ? body.receivedByStatus : (existing.receivedByStatus as IntroPartyStatus);

  if (body.givenByStatus !== undefined && !isPartyStatus(body.givenByStatus)) return jsonError("Invalid status", 400);
  if (body.receivedByStatus !== undefined && !isPartyStatus(body.receivedByStatus)) return jsonError("Invalid status", 400);

  const introduction = await prisma.introduction.update({
    where: { id },
    data: {
      givenByStatus,
      receivedByStatus,
      status: computeIntroStatus(givenByStatus, receivedByStatus),
    },
  });
  return NextResponse.json(introduction);
}
