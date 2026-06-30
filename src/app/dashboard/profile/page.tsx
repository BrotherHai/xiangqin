"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", gender: "男", age: "", area: "", occupation: "",
    wechat: "", phone: "", requirement: "", background: "", photos: "",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session.user as any).role !== "user") router.push("/admin/dashboard");
    if (status === "authenticated") {
      fetch("/api/user/profile").then(r => r.json()).then(data => {
        const p = data?.profile;
        if (p) {
          setForm({
            name: p.name, gender: p.gender, age: p.age.toString(), area: p.area,
            occupation: p.occupation, wechat: p.wechat || "", phone: p.phone || "",
            requirement: p.requirement, background: p.background || "",
            photos: JSON.parse(p.photos || "[]").join(", "),
          });
        } else {
          setForm(f => ({ ...f, name: data.name, phone: data.phone || "" }));
        }
        setLoaded(true);
      });
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/public/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, age: parseInt(form.age),
        photos: form.photos.split(",").map(s => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) router.push("/dashboard");
  }

  if (!loaded) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>征婚资料</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>年龄</Label>
                <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>地区</Label>
                <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>职业</Label>
                <Input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>微信号</Label>
                <Input value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>照片URL（逗号分隔）</Label>
                <Input value={form.photos} onChange={e => setForm({ ...form, photos: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>基本情况介绍</Label>
                <Textarea value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>择偶要求</Label>
                <Textarea value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">提交</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
