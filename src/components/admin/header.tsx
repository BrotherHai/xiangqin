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
