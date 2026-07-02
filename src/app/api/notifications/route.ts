import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first, capped at 50)
 * plus an unreadCount for badge display.
 */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;
  const userId = session!.user.id;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return NextResponse.json({ data: notifications, unreadCount });
}

/**
 * POST /api/notifications/read-all
 * Marks all of the current user's unread notifications as read.
 */
export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireUser();
  if (error) return error;
  const userId = session!.user.id;

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
