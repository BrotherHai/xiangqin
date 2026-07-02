import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold text-primary mb-2">相亲平台</h1>
        <p className="text-muted-foreground mb-8">亲友介绍型婚恋，管理员牵线更靠谱</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary text-primary-foreground px-8 font-medium hover:bg-primary/90 transition-colors"
          >
            填写征婚资料
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border px-8 font-medium text-foreground/80 hover:bg-muted transition-colors"
          >
            管理员登录
          </Link>
        </div>
      </div>
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center p-4">
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-semibold">填写资料</h3>
          <p className="text-sm text-muted-foreground mt-1">征婚人自助填写基本信息</p>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold">管理员审核</h3>
          <p className="text-sm text-muted-foreground mt-1">审核通过后进入候选库</p>
        </div>
        <div className="text-center p-4">
          <div className="text-3xl mb-2">💞</div>
          <h3 className="font-semibold">牵线匹配</h3>
          <p className="text-sm text-muted-foreground mt-1">管理员匹配推荐，双方确认</p>
        </div>
      </div>
    </div>
  );
}
