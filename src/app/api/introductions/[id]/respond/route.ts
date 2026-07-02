import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { parseJson, jsonError } from "@/lib/validate";
import { computeIntroStatus, type IntroPartyStatus } from "@/lib/introduction-status";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { session, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  const decision = body.decision;
  if (decision !== "accepted" && decision !== "rejected") {
    return jsonError("Invalid decision", 400);
  }

  const userId = session!.user.id;

  // Re-read + validate + update inside one transaction. SQLite serializes
  // writes, so the status guard below closes the TOCTOU window where two
  // concurrent responses could both pass the "still pending" check.
  type TxResult =
    | { ok: false; status: number; error: string }
    | {
        ok: true;
        updated: Awaited<ReturnType<typeof prisma.introduction.update>>;
        otherUserId: string | null;
        otherName: string;
        myName: string;
      };

  const result = await prisma.$transaction<TxResult>(async (tx) => {
    const intro = await tx.introduction.findUnique({
      where: { id },
      include: { givenBy: true, receivedBy: true },
    });
    if (!intro) return { ok: false, status: 404, error: "Not found" };

    const isGivenBy = intro.givenBy.userId === userId;
    const isReceivedBy = intro.receivedBy.userId === userId;
    if (!isGivenBy && !isReceivedBy) {
      return { ok: false, status: 403, error: "Forbidden" };
    }

    // Guard against double-response: once the intro leaves "pending" it is
    // terminal (exchanged/rejected) and must not be mutated again.
    if (intro.status !== "pending") {
      return { ok: false, status: 400, error: "该牵线已处理，无法重复操作" };
    }

    const newGiven: IntroPartyStatus = isGivenBy ? decision : (intro.givenByStatus as IntroPartyStatus);
    const newReceived: IntroPartyStatus = isReceivedBy ? decision : (intro.receivedByStatus as IntroPartyStatus);
    const data: { givenByStatus?: IntroPartyStatus; receivedByStatus?: IntroPartyStatus; status: string } = {
      status: computeIntroStatus(newGiven, newReceived),
    };
    if (isGivenBy) data.givenByStatus = decision;
    if (isReceivedBy) data.receivedByStatus = decision;

    const updated = await tx.introduction.update({ where: { id }, data });

    const other = isGivenBy ? intro.receivedBy : intro.givenBy;
    const myName = (isGivenBy ? intro.givenBy : intro.receivedBy).name;
    return {
      ok: true,
      updated,
      otherUserId: other.userId,
      otherName: other.name,
      myName,
    };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Notify the other party of the decision (best-effort, outside the tx).
  if (result.otherUserId) {
    await createNotification({
      userId: result.otherUserId,
      type: "introduction_decision",
      title: decision === "accepted" ? "对方已同意牵线" : "对方已拒绝牵线",
      body:
        decision === "accepted"
          ? `${result.myName} 已同意与你的牵线。`
          : `${result.myName} 暂时拒绝了与你的牵线。`,
      link: `/introduction/${id}`,
    });
  }

  return NextResponse.json(result.updated);
}
