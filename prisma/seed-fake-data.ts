/**
 * 虚假测试数据生成脚本
 *
 * 生成内容：
 *   - 12 个普通用户 + 12 个 Profile（男女各 6，状态混合）
 *   - 已通过（approved）Profile 的 ECR-36 测试答案（TestAnswer）
 *   - 已通过 Profile 的 MBTI 结果（MbtiResult）
 *   - 少量牵线记录（Introduction）和牵线申请（MatchRequest）
 *
 * 幂等：每次运行先清理所有 fake_* 邮箱的旧数据，再重新生成。
 *
 * 运行：npm run db:seed:fake
 * 登录：所有 fake 用户密码统一为 test1234
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import { mbtiQuestions, scoreMbti } from "../src/lib/mbti";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "test1234"; // 满足 8 位 + 字母 + 数字 的密码策略
const EMAIL_SUFFIX = "@fake.local";

interface FakeUser {
  name: string;
  gender: "男" | "女";
  age: number;
  area: string;
  occupation: string;
}

const fakeUsers: FakeUser[] = [
  { name: "李伟", gender: "男", age: 28, area: "北京", occupation: "软件工程师" },
  { name: "王强", gender: "男", age: 30, area: "上海", occupation: "产品经理" },
  { name: "张磊", gender: "男", age: 26, area: "杭州", occupation: "数据分析师" },
  { name: "刘洋", gender: "男", age: 32, area: "深圳", occupation: "医生" },
  { name: "陈杰", gender: "男", age: 29, area: "成都", occupation: "律师" },
  { name: "杨涛", gender: "男", age: 27, area: "武汉", occupation: "设计师" },
  { name: "王芳", gender: "女", age: 25, area: "北京", occupation: "教师" },
  { name: "李娜", gender: "女", age: 28, area: "上海", occupation: "会计师" },
  { name: "张敏", gender: "女", age: 24, area: "杭州", occupation: "市场经理" },
  { name: "刘婷", gender: "女", age: 31, area: "广州", occupation: "运营专员" },
  { name: "陈静", gender: "女", age: 29, area: "南京", occupation: "医生" },
  { name: "杨雪", gender: "女", age: 26, area: "西安", occupation: "产品经理" },
];

const requirements = [
  "希望对方性格温和、有稳定工作，喜欢孩子，能一起经营温馨家庭",
  "寻找善良孝顺的伴侣，三观契合，未来打算在本城市发展",
  "期待遇到一位有责任心的伙伴，互相尊重，共同成长",
  "希望对方热爱生活、有自己的兴趣爱好，周末能一起探索城市",
  "寻觅真诚、独立的另一半，能彼此扶持，平淡中也觉得幸福",
  "希望对方情绪稳定、善于沟通，遇事能商量着来",
];

const backgrounds = [
  "本科毕业，在互联网公司工作，性格开朗，业余喜欢跑步和摄影。",
  "硕士学历，从事金融行业，理性务实，周末喜欢看电影和做饭。",
  "本科毕业，热爱旅行和读书，每年至少安排一次长途旅行。",
  "重点大学毕业，工作稳定，性格偏内向但熟悉后很健谈。",
  "海归硕士，在外企工作，喜欢健身和音乐，生活作息规律。",
];

/** 指定状态：前 9 个 approved，后 2 个 pending，最后 1 个 rejected */
function statusFor(index: number): "approved" | "pending" | "rejected" {
  if (index < 9) return "approved";
  if (index < 11) return "pending";
  return "rejected";
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function randomPhone(): string {
  const head = ["133", "135", "138", "150", "158", "186", "188"];
  const tail = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
  return `${pick(head, Math.floor(Math.random() * head.length))}${tail}`;
}

async function main() {
  const passwordHash = await hash(PASSWORD, 12);

  // 确保管理员存在（Introduction 需要 adminId）
  let admin = await prisma.admin.findUnique({ where: { email: "admin@xiangqin.com" } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: { email: "admin@xiangqin.com", name: "管理员", password: await hash("admin123", 12) },
    });
    console.log("Created admin: admin@xiangqin.com / admin123");
  }

  // —— 幂等清理旧的 fake 数据 ——
  await prisma.$transaction(async (tx) => {
    const fakeUsers = await tx.user.findMany({
      where: { email: { endsWith: EMAIL_SUFFIX } },
      select: { id: true },
    });
    if (fakeUsers.length === 0) return;

    const fakeUserIds = fakeUsers.map((u) => u.id);
    const fakeProfiles = await tx.profile.findMany({
      where: { userId: { in: fakeUserIds } },
      select: { id: true },
    });
    const fakeProfileIds = fakeProfiles.map((p) => p.id);

    if (fakeProfileIds.length > 0) {
      await tx.matchRequest.deleteMany({
        where: { OR: [{ applicantId: { in: fakeProfileIds } }, { targetId: { in: fakeProfileIds } }] },
      });
      await tx.introduction.deleteMany({
        where: { OR: [{ givenById: { in: fakeProfileIds } }, { receivedById: { in: fakeProfileIds } }] },
      });
      await tx.testAnswer.deleteMany({ where: { profileId: { in: fakeProfileIds } } });
      await tx.mbtiResult.deleteMany({ where: { profileId: { in: fakeProfileIds } } });
      await tx.profile.deleteMany({ where: { id: { in: fakeProfileIds } } });
    }
    await tx.user.deleteMany({ where: { id: { in: fakeUserIds } } });
    console.log(`Cleaned up ${fakeUsers.length} previous fake users.`);
  });

  // —— 创建 User + Profile ——
  const testQuestions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  if (testQuestions.length === 0) {
    console.warn("⚠ 未找到 ECR 题目，请先运行 `npm run db:seed` 初始化题目，再运行本脚本。");
    return;
  }

  const createdProfiles: Array<{ id: string; name: string; gender: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < fakeUsers.length; i++) {
      const u = fakeUsers[i];
      const email = `fake_${i + 1}${EMAIL_SUFFIX}`;
      const user = await tx.user.create({
        data: { email, password: passwordHash, name: u.name, phone: randomPhone() },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          name: u.name,
          gender: u.gender,
          age: u.age,
          area: u.area,
          occupation: u.occupation,
          photos: JSON.stringify([]),
          wechat: `wx_${u.name}_${i + 1}`,
          phone: user.phone,
          requirement: pick(requirements, i),
          background: pick(backgrounds, i + 2),
          status: statusFor(i),
        },
      });
      createdProfiles.push({ id: profile.id, name: profile.name, gender: profile.gender });
    }
  });
  console.log(`✓ 已创建 ${createdProfiles.length} 个用户 + Profile`);

  // —— 为 approved profile 生成 ECR 答案 + MBTI 结果 ——
  const approvedProfiles = createdProfiles; // 简化：所有 fake profile 都生成（pending/rejected 也能在后台看到）

  await prisma.$transaction(async (tx) => {
    for (const p of approvedProfiles) {
      // ECR-36 答案：1-7 分随机，倾向让分数有区分度
      await tx.testAnswer.createMany({
        data: testQuestions.map((q) => ({
          profileId: p.id,
          questionId: q.id,
          score: Math.floor(Math.random() * 7) + 1,
        })),
      });

      // MBTI：随机选 a/b，再调用 scoreMbti 得到自洽的 type + scores
      const answers = mbtiQuestions.map((q) =>
        Math.random() < 0.5 ? q.choice_a.value : q.choice_b.value
      );
      const score = scoreMbti(answers);
      await tx.mbtiResult.create({
        data: {
          profileId: p.id,
          type: score.type,
          scores: JSON.stringify(score.scores),
          answers: JSON.stringify(answers),
        },
      });
    }
  });
  console.log(`✓ 已为 ${approvedProfiles.length} 个 Profile 生成 ECR 答案 + MBTI 结果`);

  // —— 生成牵线记录（Introduction，需 admin）——
  await prisma.$transaction(async (tx) => {
    const pairs: Array<[number, number]> = [
      [0, 6], // 李伟 ↔ 王芳
      [2, 8], // 张磊 ↔ 张敏
    ];
    for (const [a, b] of pairs) {
      const pa = createdProfiles[a];
      const pb = createdProfiles[b];
      await tx.introduction.create({
        data: {
          givenById: pa.id,
          receivedById: pb.id,
          adminId: admin!.id,
          status: "pending",
          givenByStatus: "accepted",
          receivedByStatus: "pending",
          message: `${pa.name} 和 ${pb.name} 在地区和年龄上比较匹配，建议牵线。`,
        },
      });
    }
  });
  console.log("✓ 已生成 2 条牵线记录");

  // —— 生成牵线申请（MatchRequest）——
  await prisma.$transaction(async (tx) => {
    const requests: Array<[number, number]> = [
      [1, 7], // 王强想认识李娜
      [4, 10], // 陈杰想认识陈静
      [3, 9], // 刘洋想认识刘婷
    ];
    for (const [a, b] of requests) {
      const pa = createdProfiles[a];
      const pb = createdProfiles[b];
      await tx.matchRequest.create({
        data: {
          applicantId: pa.id,
          targetId: pb.id,
          message: `${pa.name} 在相亲墙上看到 ${pb.name} 的资料，希望认识一下。`,
          status: "pending",
        },
      });
    }
  });
  console.log("✓ 已生成 3 条牵线申请");

  console.log("\n========== 虚假数据生成完成 ==========");
  console.log(`账号：fake_1${EMAIL_SUFFIX} ~ fake_12${EMAIL_SUFFIX}`);
  console.log(`密码：${PASSWORD}`);
  console.log(`管理员：admin@xiangqin.com / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
