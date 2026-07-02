import Link from "next/link";
import { cn } from "@/lib/utils";

export const PAGE_SIZE = 12;

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const href = (p: number) => `${basePath}?page=${Math.min(Math.max(1, p), totalPages)}`;
  const btn =
    "px-3 py-1.5 rounded-md border border-input text-sm bg-background hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className={cn("flex items-center justify-center gap-3 py-6", className)}>
      <Link href={href(page - 1)} aria-disabled={page <= 1} className={cn(btn, page <= 1 && "pointer-events-none opacity-40")}>
        上一页
      </Link>
      <span className="text-sm text-muted-foreground">
        第 {page} / {totalPages} 页（共 {total} 条）
      </span>
      <Link href={href(page + 1)} aria-disabled={page >= totalPages} className={cn(btn, page >= totalPages && "pointer-events-none opacity-40")}>
        下一页
      </Link>
    </div>
  );
}
