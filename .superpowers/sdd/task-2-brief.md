### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Write Prisma schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
}

model Profile {
  id           String   @id @default(cuid())
  name         String
  gender       String
  age          Int
  area         String
  occupation   String
  photos       String   // JSON array of photo URLs
  wechat       String?
  phone        String?
  requirement  String   // 择偶要求
  background   String?  // 基本情况介绍
  status       String   @default("pending") // pending | approved | rejected
  referrerName String   // 推荐人/亲友姓名
  referrerRelation String // 与征婚人关系
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  testAnswers  TestAnswer[]
  introductionsGiven  Introduction[] @relation("GivenProfile")
  introductionsReceived Introduction[] @relation("ReceivedProfile")
}

model TestQuestion {
  id       String   @id @default(cuid())
  title    String   // 题目内容
  dimension String  // 维度标签: 外向, 理性, 感性, 细心等
  options  String   // JSON array of {text, score}
  sortOrder Int     @default(0)
  createdAt DateTime @default(now())
}

model TestAnswer {
  id         String   @id @default(cuid())
  profileId  String
  questionId String
  score      Int
  createdAt  DateTime @default(now())
  profile    Profile  @relation(fields: [profileId], references: [id])
  question   TestQuestion @relation(fields: [questionId], references: [id])
}

model Introduction {
  id           String   @id @default(cuid())
  givenById    String   // 被推荐方A
  receivedById String   // 被推荐方B
  adminId      String
  status       String   @default("pending") // pending | accepted | rejected
  message      String?  // 管理员推荐语
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  givenBy      Profile  @relation("GivenProfile", fields: [givenById], references: [id])
  receivedBy   Profile  @relation("ReceivedProfile", fields: [receivedById], references: [id])
  admin        Admin    @relation(fields: [adminId], references: [id])
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Expected: Migration creates SQLite database file, Prisma client generates
