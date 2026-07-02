import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "user") {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/** Require any authenticated user (admin or regular user). */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Require admin, or the owning user of the given profile.
 * Admins are always allowed; regular users must own the profile.
 */
export async function requireOwnerOrAdmin(profileId: string) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (session!.user.role === "admin") return { session, error: null };

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.userId !== session!.user.id) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, error: null };
}
