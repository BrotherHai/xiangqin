import { prisma } from "./prisma";

/**
 * Notification type strings. Kept as a union for readability and to make
 * future analytics/filtering by type easy. Persisted as a plain string in
 * SQLite so adding a new type needs no migration.
 */
export type NotificationType =
  | "profile_approved"
  | "profile_rejected"
  | "introduction_received"
  | "introduction_decision"
  | "match_request_approved"
  | "match_request_rejected";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}

/**
 * Create a single notification. Silently skips on DB errors so a
 * notification failure never breaks the primary business operation
 * (notifications are best-effort, not transactional).
 */
export async function createNotification(p: NotificationPayload): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: p.userId,
        type: p.type,
        title: p.title,
        body: p.body,
        link: p.link ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

/**
 * Create several notifications in one batch. Used when a single action
 * (e.g. admin creates an introduction) should notify multiple recipients.
 */
export async function createNotifications(
  payloads: NotificationPayload[],
): Promise<void> {
  if (payloads.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: payloads.map((p) => ({
        userId: p.userId,
        type: p.type,
        title: p.title,
        body: p.body,
        link: p.link ?? null,
      })),
    });
  } catch (err) {
    console.error("Failed to create notifications:", err);
  }
}
