import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for the header badge. Returns just the count.
 */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  const count = await prisma.notification.count({
    where: { userId: session!.user.id, readAt: null },
  });
  return NextResponse.json({ count });
}
