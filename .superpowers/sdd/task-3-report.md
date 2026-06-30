# Task 3: Authentication System - Report

## Status: DONE

## What was done

### Files Created
- `src/lib/auth.ts` — NextAuth v4 configuration with CredentialsProvider (email/password), JWT strategy, session callbacks
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler (GET/POST)
- `src/app/api/auth/register/route.ts` — Admin registration API endpoint
- `src/middleware.ts` — Route protection middleware (admin & protected API routes)
- `src/app/login/page.tsx` — Login page (client component) with email/password form
- `src/app/providers.tsx` — SessionProvider wrapper component
- `prisma/seed.ts` — Seed script to create initial admin user

### Files Modified
- `src/app/layout.tsx` — Added `Providers` wrapper for SessionProvider
- `prisma.config.ts` — Added `migrations.seed` config for `prisma db seed`
- `package.json` — Added dependencies (bcryptjs, @types/bcryptjs, tsx, @prisma/adapter-better-sqlite3, better-sqlite3)

### Files Deleted
- `package.json` — Removed stale `prisma.seed` key (Prisma 7 uses `prisma.config.ts` instead)

## Version Adaptation Decisions

### NextAuth: v4.24.14 (stable)
Used `NextAuthOptions` type and `NextAuth()` handler pattern. The installed version was v4, so no v5 API changes needed.

### Prisma 7 Breaking Changes
- `new PrismaClient()` without arguments throws in standalone scripts (requires `adapter` or `accelerateUrl`)
- Seed config must be in `prisma.config.ts` (not `package.json`)
- Fixed by installing `@prisma/adapter-better-sqlite3` + `better-sqlite3` and passing `{ adapter }` in seed script
- The existing `src/lib/prisma.ts` (`new PrismaClient()` without args) still works in Next.js app context due to framework integration

### Next.js 16
Minor: middleware convention is deprecated in favor of `proxy`, but `middleware.ts` still works

## Seed Result
Admin user created: `admin@xiangqin.com` / `admin123`

## Files Changed (Summary)
- **Created:** 7 files
- **Modified:** 3 files
- **Installed packages:** bcryptjs, @types/bcryptjs, tsx, @prisma/adapter-better-sqlite3, better-sqlite3
