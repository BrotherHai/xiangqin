import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileDetail } from "@/components/admin/profile-detail";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { testAnswers: { include: { question: true } } },
  });
  if (!profile) notFound();
  return <ProfileDetail profile={profile} />;
}
