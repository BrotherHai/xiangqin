/**
 * Admin 路由段的加载态。
 *
 * 在 admin 页面的 Server Component 查询数据期间，Next.js 会立即渲染本文件
 * 作为 Suspense fallback。由于 admin layout（Sidebar + Header）是常驻的，
 * 切换菜单时只有 <main> 区域显示骨架屏，导航上下文保持不变。
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* 页面标题栏骨架 */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg bg-foreground/10 animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-foreground/10 animate-pulse" />
      </div>

      {/* 统计卡片骨架（仪表盘风格） */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-6 shadow-sm border space-y-3">
            <div className="h-4 w-20 rounded bg-foreground/10 animate-pulse" />
            <div className="h-8 w-16 rounded bg-foreground/15 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 列表卡片骨架（资料/牵线/申请列表风格） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 shadow-sm border space-y-3">
            <div className="h-4 w-3/4 rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-full rounded bg-foreground/10 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-foreground/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
