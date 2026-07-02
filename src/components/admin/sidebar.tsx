"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/profiles", label: "资料管理" },
  { href: "/admin/tests", label: "性格测试" },
  { href: "/admin/match", label: "匹配推荐" },
  { href: "/admin/introductions", label: "牵线管理" },
  { href: "/admin/requests", label: "牵线申请" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r hidden lg:block">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">相亲平台</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-4 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
