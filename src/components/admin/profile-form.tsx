"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileFormProps {
  initialData?: any;
  profileId?: string;
}

export function ProfileForm({ initialData, profileId }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    gender: initialData?.gender || "男",
    age: initialData?.age?.toString() || "",
    area: initialData?.area || "",
    occupation: initialData?.occupation || "",
    wechat: initialData?.wechat || "",
    phone: initialData?.phone || "",
    requirement: initialData?.requirement || "",
    background: initialData?.background || "",
    referrerName: initialData?.referrerName || "",
    referrerRelation: initialData?.referrerRelation || "",
    photos: initialData ? JSON.parse(initialData.photos || "[]").join(", ") : "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = profileId ? `/api/profiles/${profileId}` : "/api/profiles";
    const method = profileId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: parseInt(form.age),
        photos: form.photos.split(",").map((s: string) => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      router.push("/admin/profiles");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profileId ? "编辑资料" : "新建资料"}</CardTitle>
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
          <div className="space-y-2">
            <Label>推荐人姓名</Label>
            <Input value={form.referrerName} onChange={e => setForm({ ...form, referrerName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>与征婚人关系</Label>
            <Input value={form.referrerRelation} onChange={e => setForm({ ...form, referrerRelation: e.target.value })} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>基本情况介绍</Label>
            <Textarea value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>择偶要求</Label>
            <Textarea value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} required />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit">{profileId ? "保存" : "创建"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
