# 相亲平台（xiangqin）

一个基于 Next.js 的相亲牵线平台：用户提交征婚资料 → 管理员审核 → 上墙浏览 → 申请牵线 → 管理员撮合 → 双向确认并交换联系方式。内置 ECR-36 依恋风格测试与 MBTI 性格测试，辅助匹配。

## 技术栈

- **框架**：Next.js 16（App Router）+ React 19
- **语言**：TypeScript（strict）
- **样式**：Tailwind CSS v4 + shadcn（base-ui）
- **数据库**：SQLite + Prisma 7（`@prisma/adapter-better-sqlite3`）
- **鉴权**：next-auth v4（Credentials + JWT）
- **地区选择**：element-china-area-data

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并按需修改：

```bash
cp .env.example .env
```

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | SQLite 连接串，默认 `file:./dev.db` |
| `NEXTAUTH_SECRET` | JWT 签名密钥，生产环境请用 `openssl rand -base64 32` 生成强随机值 |
| `NEXTAUTH_URL` | 应用根地址，本地默认 `http://localhost:3000` |
| `UPLOAD_URL` | 第三方图床上传地址（用于照片上传） |
| `UPLOAD_TOKEN` | 图床上传 token，留空则上传接口返回 500 |

### 3. 初始化数据库

```bash
npm run db:push     # 根据 schema 建表
npm run db:seed     # 写入默认管理员 + ECR-36 题目
```

种子数据创建的默认管理员账号：

- 邮箱：`admin@xiangqin.com`
- 密码：`admin123`

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:migrate` | 创建并应用新的迁移 |
| `npm run db:push` | 将 schema 同步到数据库（开发用） |
| `npm run db:seed` | 灌入种子数据 |
| `npm run db:studio` | 打开 Prisma Studio 查看数据 |

## 功能概览

- 用户注册 / 登录，角色区分（用户 / 管理员）
- 用户填写并提交征婚资料，照片上传
- 管理员审核资料（通过 / 拒绝）
- 相亲墙浏览与筛选（性别 / 年龄 / 地区）
- 用户对心仪对象申请牵线，管理员审核申请并自动创建牵线
- 双向确认牵线，双方同意后自动交换联系方式
- ECR-36 依恋风格测试、MBTI 性格测试
- 管理员匹配面板（依恋风格 + MBTI 兼容度评分）
