import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { parseJson, asString, jsonError } from "@/lib/validate";

/** Maximum concurrent pending applications per user — prevents mass-applying. */
const MAX_PENDING_REQUESTS = 5;
/** Cooldown after a rejection before re-applying to the same target (ms). */
const REJECT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const requests = await prisma.matchRequest.findMany({
    include: {
      applicant: { select: { id: true, name: true, gender: true, age: true, area: true } },
      target: { select: { id: true, name: true, gender: true, age: true, area: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireUser();
  if (error) return error;
  const userId = session!.user.id;

  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  const targetId = asString(body.targetId);
  if (!targetId) return jsonError("缺少目标资料", 422);

  const me = await prisma.profile.findUnique({ where: { userId } });
  if (!me || me.status !== "approved") {
    return NextResponse.json({ error: "请先完善并审核通过自己的资料" }, { status: 400 });
  }
  if (me.id === targetId) {
    return NextResponse.json({ error: "不能向自己申请" }, { status: 400 });
  }
  const target = await prisma.profile.findUnique({ where: { id: targetId } });
  if (!target || target.status !== "approved") {
    return NextResponse.json({ error: "目标资料不可用" }, { status: 400 });
  }

  // Run the dedup + anti-spam checks + create atomically. SQLite serializes
  // writes inside a transaction, which closes the TOCTOU window between the
  // findFirst duplicate check and the create.
  try {
    const request = await prisma.$transaction(async (tx) => {
      // 1. Cap concurrent pending applications to discourage mass-applying.
      const pendingCount = await tx.matchRequest.count({
        where: { applicantId: me.id, status: "pending" },
      });
      if (pendingCount >= MAX_PENDING_REQUESTS) {
        throw new Error("待处理申请过多，请先等待现有申请处理后再发起新申请");
      }

      // 2. Cooldown after a rejection to the same target — prevents harassment.
      const cooldownSince = new Date(Date.now() - REJECT_COOLDOWN_MS);
      const recentRejected = await tx.matchRequest.findFirst({
        where: {
          applicantId: me.id,
          targetId,
          status: "rejected",
          updatedAt: { gt: cooldownSince },
        },
        select: { id: true },
      });
      if (recentRejected) {
        throw new Error("近期对该征婚人的申请曾被拒绝，请 30 天后再试");
      }

      // 3. No duplicate pending application to the same target.
      const existing = await tx.matchRequest.findFirst({
        where: { applicantId: me.id, targetId, status: "pending" },
        select: { id: true },
      });
      if (existing) {
        throw new Error("已提交过申请，请等待管理员审核");
      }

      return tx.matchRequest.create({
        data: { applicantId: me.id, targetId, message: asString(body.message) ?? null },
      });
    });
    return NextResponse.json(request);
  } catch (e) {
    const message = e instanceof Error ? e.message : "提交失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
