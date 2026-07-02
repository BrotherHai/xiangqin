import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { parseJson, asString, jsonError } from "@/lib/validate";
import { createNotifications, type NotificationPayload } from "@/lib/notifications";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const introductions = await prisma.introduction.findMany({
    include: {
      givenBy: true,
      receivedBy: true,
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(introductions);
}

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  const givenById = asString(body.givenById);
  const receivedById = asString(body.receivedById);
  if (!givenById || !receivedById) return jsonError("缺少牵线双方", 422);

  const introduction = await prisma.introduction.create({
    data: {
      givenById,
      receivedById,
      adminId: session!.user.id,
      message: asString(body.message) ?? null,
    },
  });

  // Notify both parties (best-effort). Admin-created profiles may have no
  // linked user account, in which case there's nobody to notify.
  const [givenBy, receivedBy] = await Promise.all([
    prisma.profile.findUnique({ where: { id: givenById }, select: { userId: true, name: true } }),
    prisma.profile.findUnique({ where: { id: receivedById }, select: { userId: true, name: true } }),
  ]);
  const payloads: (NotificationPayload | null)[] = [
    givenBy?.userId
      ? {
          userId: givenBy.userId,
          type: "introduction_received",
          title: "收到一条新的牵线",
          body: `管理员为你和 ${receivedBy?.name ?? "对方"} 发起了牵线，请前往确认。`,
          link: `/introduction/${introduction.id}`,
        }
      : null,
    receivedBy?.userId
      ? {
          userId: receivedBy.userId,
          type: "introduction_received",
          title: "收到一条新的牵线",
          body: `管理员为你和 ${givenBy?.name ?? "对方"} 发起了牵线，请前往确认。`,
          link: `/introduction/${introduction.id}`,
        }
      : null,
  ];
  await createNotifications(payloads.filter((p): p is NotificationPayload => p !== null));

  return NextResponse.json(introduction);
}
