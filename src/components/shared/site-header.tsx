import Link from "next/link";

/**
 * Shared site header for user-facing pages.
 * Pass optional `children` for the right-side actions (e.g. user name +
 * sign-out button, or a "back" link). Server component friendly.
 */
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <Link href="/dashboard" className="text-lg font-bold text-primary">
        相亲平台
      </Link>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
