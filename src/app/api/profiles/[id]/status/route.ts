import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { createNotification } from "@/lib/notifications";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { status } = await req.json();
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const profile = await prisma.profile.update({
    where: { id },
    data: { status },
  });

  // Notify the profile owner of the review result (best-effort). Admin-created
  // profiles may have no linked user; "pending" is a reset, not worth notifying.
  if (profile.userId && (status === "approved" || status === "rejected")) {
    await createNotification({
      userId: profile.userId,
      type: status === "approved" ? "profile_approved" : "profile_rejected",
      title: status === "approved" ? "资料已通过审核" : "资料未通过审核",
      body:
        status === "approved"
          ? "你的征婚资料已通过审核，现已上墙展示。"
          : "你的征婚资料未通过审核，请修改后重新提交。",
      link: status === "approved" ? "/wall" : "/dashboard/profile",
    });
  }

  return NextResponse.json(profile);
}
