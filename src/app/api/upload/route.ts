import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { requireAuth } from "@/lib/auth-guards";

const UPLOAD_URL = process.env.UPLOAD_URL;
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { error } = await requireAuth();
  if (error) return error;
  if (!UPLOAD_URL || !UPLOAD_TOKEN) {
    return NextResponse.json({ error: "上传服务未配置" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "仅支持 JPG/PNG/WEBP 图片" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("image", file, file.name);
  upstream.append("token", UPLOAD_TOKEN);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: upstream });
  const data = await res.json().catch(() => null);

  if (!data || data.result !== "success" || !data.url) {
    return NextResponse.json({ error: data?.message || "上传失败" }, { status: 400 });
  }
  return NextResponse.json({ url: data.url });
}
