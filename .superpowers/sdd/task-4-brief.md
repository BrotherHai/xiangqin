### Task 4: Admin Layout & Navigation

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/header.tsx`

- [ ] **Step 1: Create admin layout**

`src/app/admin/layout.tsx`:
```typescript
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create sidebar component**

`src/components/admin/sidebar.tsx`:
```typescript
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
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r hidden lg:block">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-pink-600">相亲平台</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-4 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-pink-50 text-pink-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create header with mobile menu**

`src/components/admin/header.tsx`:
```typescript
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/profiles", label: "资料管理" },
  { href: "/admin/tests", label: "性格测试" },
  { href: "/admin/match", label: "匹配推荐" },
  { href: "/admin/introductions", label: "牵线管理" },
];

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between lg:justify-end">
      <button className="lg:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{session?.user?.name}</span>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>退出</Button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-white p-6 lg:hidden">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("block px-4 py-3 rounded-lg text-sm")}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Create dashboard page**

`src/app/admin/dashboard/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [total, pending, approved, introductions] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { status: "pending" } }),
    prisma.profile.count({ where: { status: "approved" } }),
    prisma.introduction.count(),
  ]);

  const stats = [
    { label: "总资料数", value: total },
    { label: "待审核", value: pending },
    { label: "已通过", value: approved },
    { label: "牵线记录", value: introductions },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: Clean build with no errors. Visit /admin/dashboard after login.
