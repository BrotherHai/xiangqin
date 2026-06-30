# Task 2: Database Schema — Report

## Summary

Created Prisma schema with 5 models (Admin, Profile, TestQuestion, TestAnswer, Introduction) for SQLite, ran migration, and generated Prisma Client.

## What Was Done

### 1. Prisma Schema (`prisma/schema.prisma`)

Adapted for Prisma 7 (v7.8.0) compatibility:
- Removed `url` from `datasource db` (moved to `prisma.config.ts`)
- Added explicit opposite relation fields on `TestQuestion` (`answers TestAnswer[]`) and `Admin` (`introductions Introduction[]`) — required by Prisma 7's stricter validation
- All 5 models from the task brief are present with all specified fields

### 2. Prisma Config (`prisma.config.ts`)

Created at project root as required by Prisma 7. Reads `DATABASE_URL` from `.env`.

### 3. Migration

`npx prisma migrate dev --name init` ran successfully:
- **Migration:** `prisma/migrations/20260630013535_init/migration.sql`
- **Database:** `E:\Projects\xiangqin\dev.db` (SQLite)
- All 5 tables created with proper foreign keys and indices

### 4. Client Generation

`npx prisma generate` ran successfully — Prisma Client v7.8.0 generated to `node_modules/@prisma/client`.

## Files Created

| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Full schema with 5 models |
| `prisma.config.ts` | Prisma 7 configuration (datasource URL) |
| `prisma/migrations/20260630013535_init/migration.sql` | Initial migration SQL |
| `prisma/migrations/migration_lock.toml` | Migration lock file |
| `dev.db` | SQLite database file |

## Issues

1. **Prisma 7 breaking changes:** The brief's schema was Prisma 6 format. Required:
   - Removing `url` from `datasource db` and creating `prisma.config.ts`
   - Adding explicit bidirectional relation fields (Prisma 7 validation requirement)
2. **Database location:** SQLite `dev.db` was created at project root (where `prisma.config.ts` resolves relative paths), not inside `prisma/`. The `.env` `DATABASE_URL="file:./dev.db"` now resolves relative to project root.
