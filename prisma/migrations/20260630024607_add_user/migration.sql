-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "wechat" TEXT,
    "phone" TEXT,
    "requirement" TEXT NOT NULL,
    "background" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referrerName" TEXT NOT NULL,
    "referrerRelation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("age", "area", "background", "createdAt", "gender", "id", "name", "occupation", "phone", "photos", "referrerName", "referrerRelation", "requirement", "status", "updatedAt", "wechat") SELECT "age", "area", "background", "createdAt", "gender", "id", "name", "occupation", "phone", "photos", "referrerName", "referrerRelation", "requirement", "status", "updatedAt", "wechat" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
