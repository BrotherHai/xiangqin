# 安全加固 + 交换联系方式 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 6 项 🔴 安全/授权漏洞，并实现 model B（征婚人本人确认）的交换联系方式流程；匹配（2B）本次不做。

**Architecture:** 新增统一鉴权助手 `requireAdmin/requireUser`，中间件加角色校验，所有受保护 API 显式鉴权。Introduction 增加双侧状态字段，双方均同意自动进入 `exchanged` 并对当事人互换联系方式。

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + SQLite, NextAuth v4 (JWT, role in token), TypeScript strict.

**Verification:** 项目无测试框架（属 🟡，本次不做）。每个任务后按需 `npm run lint`；全部完成后 `npx prisma generate` + `npm run build`（含类型检查）+ 手动走查。

## Global Constraints
- 不得引入新依赖。
- 鉴权一律走 `src/lib/auth-guards.ts` 的助手，禁止裸 `getServerSession` 后忘记判 role。
- 现有 `as any` 访问 `session.user.id/role` 的写法保持（Session 类型增强属 🟡，本次不做）。
- 中文 UI 文案保持现有风格。

---

## Task 1: 数据库 — Introduction 双侧状态字段

**Files:**
- Modify: `prisma/schema.prisma` (Introduction model)
- Create: `prisma/migrations/<timestamp>_contact_exchange/migration.sql`

**Schema 变更**（Introduction 增加 `givenByStatus`、`receivedByStatus`；`status` 取值域改为 pending|exchanged|rejected）:
```prisma
model Introduction {
  ...existing fields...
  status            String   @default("pending")
  givenByStatus     String   @default("pending")
  receivedByStatus  String   @default("pending")
  ...
}
```

- [ ] **Step 1:** 编辑 `prisma/schema.prisma`，在 `status` 后加两行字段。
- [ ] **Step 2:** 生成迁移并应用：`npx prisma migrate dev --name contact_exchange`
- [ ] **Step 3:** 编辑生成的 `migration.sql`，在 ALTER 之后追加历史数据回填（把旧 `accepted` 升级为「双侧已同意 + 已交换」）:
```sql
UPDATE "Introduction" SET "givenByStatus"='accepted',"receivedByStatus"='accepted',"status"='exchanged' WHERE "status"='accepted';
```
- [ ] **Step 4:** `npx prisma migrate deploy`（或重新 `migrate dev` 确保应用），`npx prisma generate`。
- [ ] **Step 5:** commit。

---

## Task 2: 统一鉴权助手

**Files:**
- Create: `src/lib/auth-guards.ts`

**Produces:** `requireAdmin(): Promise<{session, error}>`、`requireUser(): Promise<{session, error}>`，error 为 `NextResponse 401` 或 null。

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin")
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null as null | NextResponse };
}
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "user")
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null as null | NextResponse };
}
```

- [ ] 写文件、commit。

---

## Task 3: 中间件角色校验

**Files:** Modify `src/middleware.ts`

`/admin/*` → `token.role==="admin"`；`/dashboard/*` → `"user"`；其余匹配项仍需 token。`/test/:path*` 不加入 matcher（由页内 server 鉴权处理）。

```ts
authorized: ({ req, token }) => {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/admin")) return token?.role === "admin";
  if (path.startsWith("/dashboard")) return token?.role === "user";
  if (path.startsWith("/api/auth")) return true;
  if (path.startsWith("/api")) return !!token;
  return true;
},
```

- [ ] 改、commit。

---

## Task 4: 给所有 admin API 加 `requireAdmin()`

**Files:** Modify
- `src/app/api/profiles/route.ts` (GET, POST)
- `src/app/api/profiles/[id]/route.ts` (GET, PUT)
- `src/app/api/profiles/[id]/status/route.ts` (PUT)
- `src/app/api/tests/route.ts` (POST only；GET 保持公开供答题页)
- `src/app/api/tests/[id]/route.ts` (PUT, DELETE)
- `src/app/api/match/route.ts` (GET)
- `src/app/api/introductions/route.ts` (GET, POST)

每个 handler 开头：
```ts
const { error } = await requireAdmin();
if (error) return error;
```
（introductions POST 用 `session.user.id` 作为 adminId，从 requireAdmin 返回的 session 取。）

- [ ] 逐文件加、`npm run lint`、commit。

---

## Task 5: tests/submit 归属校验 + 公开测试页收敛

**Files:** Modify
- `src/app/api/tests/submit/route.ts`：开头 `requireUser` 或 admin；随后校验 `profile.userId === session.user.id`（admin 放行）。
- `src/app/test/[profileId]/page.tsx`：改为 server 端 `requireUser`，并校验 `profile.userId === session.user.id`，否则 `redirect("/login")`。

- [ ] 改、commit。

---

## Task 6: 删除危险端点 + dev.db 移出 git

**Files:**
- Delete: `src/app/api/auth/register/`（含 route.ts）及空目录 `src/app/api/auth/register/user/`
- Modify: `.gitignore`（追加 `/prisma/*.db`、`*.db`、`dev.db`）
- Run: `git rm --cached dev.db`（先确认无其他依赖）

- [ ] 先 `rg "api/auth/register" src` 确认无引用 → 删除目录 → 改 .gitignore → `git rm --cached dev.db` → commit。

---

## Task 7: 交换联系方式 — 后端

**Files:** Modify/Create
- Modify `src/app/api/introductions/[id]/route.ts`：改为 admin-only；body 接收 `{ givenByStatus?, receivedByStatus? }`，写入后按规则重算 `status`（任一 rejected→rejected；均 accepted→exchanged；否则 pending）。
- Create `src/app/api/introductions/[id]/respond/route.ts`：user-only；body `{ decision: "accepted"|"rejected" }`；查 intro，判断当前 user 拥有 givenBy 还是 receivedBy profile（`profile.userId === session.user.id`），更新对应一侧，重算 status。
- Create `src/app/api/user/introductions/route.ts`：user-only；返回涉及当前用户 profile 的所有 intro，每条含：己方一侧、对方 profile 基本信息、整体状态；当 `status==="exchanged"` 时附带对方 `wechat`/`phone`。

重算规则（两处复用，内联即可）:
```ts
function computeStatus(g: string, r: string) {
  if (g === "rejected" || r === "rejected") return "rejected";
  if (g === "accepted" && r === "accepted") return "exchanged";
  return "pending";
}
```

- [ ] 写三个端点、commit。

---

## Task 8: 交换联系方式 — 管理员前端

**Files:** Modify `src/components/admin/introductions-list.tsx`
- statusMap 增加 `exchanged`。
- 显示双侧状态（givenByStatus / receivedByStatus）。
- 「通过/拒绝」改为针对某一侧（默认提供两侧操作或下拉选择）；调用 `PUT /api/introductions/[id]` 带 `givenByStatus`/`receivedByStatus`。
- exchanged 时管理员可见双方联系方式（需页面 query 带 wechat/phone —— 更新 `src/app/admin/introductions/page.tsx` 的 select 加 wechat/phone）。

- [ ] 改组件 + 页面 query、commit。

---

## Task 9: 交换联系方式 — 用户前端

**Files:** Modify `src/app/dashboard/page.tsx`
- 拉 `/api/user/introductions`，新增「我的牵线」卡片：列出涉及自己的 intro，显示对方基本信息 + 己方一侧状态。
- 己方 pending 时显示「同意 / 拒绝」按钮 → `POST /api/introductions/[id]/respond`。
- status===exchanged 时显示对方 `wechat`/`phone`。
- 提示文案：己方已同意待对方确认 / 已拒绝 / 已交换。

- [ ] 改、commit。

---

## Task 10: 整理 `/api/public/profiles`（对齐）

**Files:**
- Modify `src/app/api/user/profile/route.ts`：新增 POST（requireUser；upsert 当前 user 的 profile，字段同 public/profiles，新建时 referrerName/Relation = "本人"，状态 pending）。
- Modify `src/app/dashboard/profile/page.tsx`：提交改打到 `/api/user/profile`。
- Delete `src/app/api/public/profiles/`。

- [ ] 改、commit。

---

## Task 11: 更新公开牵线详情页状态文案

**Files:** Modify `src/app/introduction/[id]/page.tsx`
- 状态文案增加 `exchanged → 已交换`。

- [ ] 改、commit。

---

## Task 12: 全量验证

- [ ] `npm run lint`
- [ ] `npx prisma generate && npm run build`
- [ ] 手动走查：admin 登录 → 发起牵线 → user 登录同意两侧 → exchanged → 双方看到联系方式；权限越权用例（user 访问 /admin、调 admin API）返回 401/重定向。

---

## Self-Review 已检查
- Spec 覆盖：🔴 1-6 全覆盖（Tasks 2-6），🟠 A 全覆盖（1,7,8,9,11），🟠 C（Task 10）；2B 匹配按要求不做。
- 无占位符；类型/命名一致（givenByStatus / receivedByStatus / exchanged 全局统一）。
