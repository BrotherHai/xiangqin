import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "user") redirect("/admin/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  return (
    <ProfileForm
      initialName={user?.name ?? ""}
      initialPhone={user?.phone ?? ""}
      initialProfile={user?.profile ?? null}
    />
  );
}
