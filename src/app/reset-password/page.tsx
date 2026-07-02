import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-xl font-bold">链接无效</h2>
            <p className="text-sm text-muted-foreground">
              重置链接缺少必要参数，请通过「找回密码」重新获取。
            </p>
            <Link href="/forgot-password" className="inline-block text-primary hover:underline text-sm">
              前往找回密码
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
