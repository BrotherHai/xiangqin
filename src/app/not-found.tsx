import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-sm border p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">404</h1>
        <p className="text-sm text-muted-foreground">页面不存在或已被移除。</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    </div>
  );
}
