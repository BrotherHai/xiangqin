import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileDetail } from "@/components/admin/profile-detail";
import { scoreEcrFromAnswers } from "@/lib/ecr";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      testAnswers: {
        include: { question: { select: { title: true, dimension: true, sortOrder: true } } },
      },
      mbtiResult: true,
    },
  });
  if (!profile) notFound();

  const ecr = scoreEcrFromAnswers(profile.testAnswers);
  return <ProfileDetail profile={profile} ecr={ecr} mbti={profile.mbtiResult} />;
}
