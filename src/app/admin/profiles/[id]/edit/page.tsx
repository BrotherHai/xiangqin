import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) notFound();
  return <ProfileForm initialData={profile} profileId={profile.id} />;
}
