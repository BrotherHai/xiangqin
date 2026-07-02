"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/image-uploader";
import { AreaCascader } from "@/components/area-cascader";

export interface InitialProfile {
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  wechat: string | null;
  phone: string | null;
  requirement: string;
  background: string | null;
  photos: string;
  expectMinAge: number | null;
  expectMaxAge: number | null;
  expectArea: string | null;
}

export function ProfileForm({
  initialName,
  initialPhone,
  initialProfile,
}: {
  initialName: string;
  initialPhone: string;
  initialProfile: InitialProfile | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    if (initialProfile) {
      return {
        name: initialProfile.name,
        gender: initialProfile.gender,
        age: String(initialProfile.age),
        area: initialProfile.area,
        occupation: initialProfile.occupation,
        wechat: initialProfile.wechat || "",
        phone: initialProfile.phone || "",
        requirement: initialProfile.requirement,
        background: initialProfile.background || "",
        photos: safeParsePhotos(initialProfile.photos),
        expectMinAge: initialProfile.expectMinAge != null ? String(initialProfile.expectMinAge) : "",
        expectMaxAge: initialProfile.expectMaxAge != null ? String(initialProfile.expectMaxAge) : "",
        expectArea: initialProfile.expectArea || "",
      };
    }
    return {
      name: initialName,
      gender: "男",
      age: "",
      area: "",
      occupation: "",
      wechat: "",
      phone: initialPhone,
      requirement: "",
      background: "",
      photos: [] as string[],
      expectMinAge: "",
      expectMaxAge: "",
      expectArea: "",
    };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age, 10),
          photos: form.photos,
          expectMinAge: form.expectMinAge ? parseInt(form.expectMinAge, 10) : null,
          expectMaxAge: form.expectMaxAge ? parseInt(form.expectMaxAge, 10) : null,
          expectArea: form.expectArea || null,
        }),
      });
      if (res.ok) {
        toast.success("资料已保存");
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "保存失败");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>征婚资料</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <select id="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">年龄</Label>
                <Input id="age" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">地区</Label>
                <AreaCascader value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">职业</Label>
                <Input id="occupation" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wechat">微信号</Label>
                <Input id="wechat" value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>照片（最多 6 张）</Label>
                <ImageUploader value={form.photos} onChange={(urls) => setForm({ ...form, photos: urls })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="background">基本情况介绍</Label>
                <Textarea id="background" value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>择偶期望（用于智能匹配，留空表示不限）</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    type="number"
                    placeholder="最小年龄"
                    value={form.expectMinAge}
                    onChange={e => setForm({ ...form, expectMinAge: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="最大年龄"
                    value={form.expectMaxAge}
                    onChange={e => setForm({ ...form, expectMaxAge: e.target.value })}
                  />
                  <Input
                    placeholder="期望地区（如：北京）"
                    value={form.expectArea}
                    onChange={e => setForm({ ...form, expectArea: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="requirement">其他要求</Label>
                <Textarea id="requirement" value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "保存中…" : "提交"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function safeParsePhotos(photos: string): string[] {
  try {
    const arr = JSON.parse(photos || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
