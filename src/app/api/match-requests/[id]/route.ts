import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseJson, jsonError } from "@/lib/validate";
import { createNotifications, type NotificationPayload } from "@/lib/notifications";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  if (body.status !== "approved" && body.status !== "rejected") {
    return jsonError("Invalid status", 400);
  }
  const status = body.status as "approved" | "rejected";

  const request = await prisma.matchRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "pending") {
    return NextResponse.json({ error: "该申请已处理" }, { status: 400 });
  }

  const adminId = session!.user.id;

  if (status === "rejected") {
    const updated = await prisma.matchRequest.update({
      where: { id },
      data: { status: "rejected", adminId },
    });

    // Notify the applicant their request was declined (best-effort).
    const applicant = await prisma.profile.findUnique({
      where: { id: request.applicantId },
      select: { userId: true },
    });
    if (applicant?.userId) {
      await createNotifications([
        {
          userId: applicant.userId,
          type: "match_request_rejected",
          title: "牵线申请未通过",
          body: "管理员暂未通过你的牵线申请。",
          link: "/dashboard",
        },
      ]);
    }
    return NextResponse.json(updated);
  }

  const [updated, createdIntro] = await prisma.$transaction([
    prisma.matchRequest.update({
      where: { id },
      data: { status: "approved", adminId },
    }),
    prisma.introduction.create({
      data: {
        givenById: request.applicantId,
        receivedById: request.targetId,
        adminId,
        givenByStatus: "accepted",
        receivedByStatus: "pending",
        status: "pending",
        message: request.message,
      },
    }),
  ]);

  // Notify applicant (request approved) and target (new introduction to confirm).
  const [applicant, target] = await Promise.all([
    prisma.profile.findUnique({ where: { id: request.applicantId }, select: { userId: true, name: true } }),
    prisma.profile.findUnique({ where: { id: request.targetId }, select: { userId: true, name: true } }),
  ]);
  const payloads: (NotificationPayload | null)[] = [
    applicant?.userId
      ? {
          userId: applicant.userId,
          type: "match_request_approved",
          title: "牵线申请已通过",
          body: `你向 ${target?.name ?? "对方"} 发起的牵线申请已通过，请前往确认牵线。`,
          link: `/introduction/${createdIntro.id}`,
        }
      : null,
    target?.userId
      ? {
          userId: target.userId,
          type: "introduction_received",
          title: "收到一条新的牵线",
          body: `${applicant?.name ?? "对方"} 申请与你牵线，请前往确认。`,
          link: `/introduction/${createdIntro.id}`,
        }
      : null,
  ];
  await createNotifications(payloads.filter((p): p is NotificationPayload => p !== null));

  return NextResponse.json(updated);
}
