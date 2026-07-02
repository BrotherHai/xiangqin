import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { getUserIntroductions } from "@/lib/dashboard-data";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;
  const result = await getUserIntroductions(session!.user.id);
  return NextResponse.json(result);
}
