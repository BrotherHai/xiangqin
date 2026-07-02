-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Introduction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "givenById" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "givenByStatus" TEXT NOT NULL DEFAULT 'pending',
    "receivedByStatus" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Introduction_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Introduction_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Introduction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Introduction" ("adminId", "createdAt", "givenById", "id", "message", "receivedById", "status", "updatedAt") SELECT "adminId", "createdAt", "givenById", "id", "message", "receivedById", "status", "updatedAt" FROM "Introduction";
DROP TABLE "Introduction";
ALTER TABLE "new_Introduction" RENAME TO "Introduction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill: historical 'accepted' intros become 双侧已同意 + 已交换
UPDATE "Introduction" SET "givenByStatus" = 'accepted', "receivedByStatus" = 'accepted', "status" = 'exchanged' WHERE "status" = 'accepted';
