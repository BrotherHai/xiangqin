import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type PartyInfo = { name: string; gender: string; age: number; area: string; wechat: string | null; phone: string | null };

function Party({ p, label, exchanged }: { p: PartyInfo; label: string; exchanged: boolean }) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <p className="font-semibold">{p.name} <span className="text-xs text-muted-foreground">{label}</span></p>
      <p className="text-sm text-muted-foreground">
        {p.gender} · {p.age}岁 · {p.area}
      </p>
      {exchanged && (p.wechat || p.phone) && (
        <div className="mt-2 text-sm text-foreground/80">
          {p.wechat && <p>微信：{p.wechat}</p>}
          {p.phone && <p>电话：{p.phone}</p>}
        </div>
      )}
    </div>
  );
}

export default async function IntroductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent("/introduction/" + id)}`);

  const introduction = await prisma.introduction.findUnique({
    where: { id },
    include: {
      givenBy: { select: { name: true, gender: true, age: true, area: true, userId: true, wechat: true, phone: true } },
      receivedBy: { select: { name: true, gender: true, age: true, area: true, userId: true, wechat: true, phone: true } },
      admin: { select: { name: true } },
    },
  });
  if (!introduction) notFound();

  const isAdmin = session.user.role === "admin";
  const isGivenBy = introduction.givenBy.userId === session.user.id;
  const isReceivedBy = introduction.receivedBy.userId === session.user.id;
  if (!isAdmin && !isGivenBy && !isReceivedBy) {
    notFound();
  }

  const exchanged = introduction.status === "exchanged";

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-card rounded-xl shadow-sm border p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">牵线详情</h1>
          <div className="space-y-4">
            <Party p={introduction.givenBy} label="发起方" exchanged={exchanged} />
            <p className="text-2xl text-muted-foreground">⇄</p>
            <Party p={introduction.receivedBy} label="接收方" exchanged={exchanged} />
            {introduction.message && (
              <p className="text-sm text-muted-foreground italic">&ldquo;{introduction.message}&rdquo;</p>
            )}
            <p className="text-xs text-muted-foreground">管理员: {introduction.admin.name}</p>
            <p className="text-sm text-muted-foreground">
              状态: {introduction.status === "pending" ? "待确认" : introduction.status === "exchanged" ? "已交换" : introduction.status === "accepted" ? "已通过" : "已拒绝"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
