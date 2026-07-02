"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/image-uploader";
import { AreaCascader } from "@/components/area-cascader";

interface ProfileFormInitialData {
  name?: string;
  gender?: string;
  age?: number;
  area?: string;
  occupation?: string;
  wechat?: string | null;
  phone?: string | null;
  requirement?: string;
  background?: string | null;
  photos?: string;
  expectMinAge?: number | null;
  expectMaxAge?: number | null;
  expectArea?: string | null;
}

interface ProfileFormProps {
  initialData?: ProfileFormInitialData;
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
    photos: initialData ? JSON.parse(initialData.photos || "[]") : ([] as string[]),
    expectMinAge: initialData?.expectMinAge != null ? String(initialData.expectMinAge) : "",
    expectMaxAge: initialData?.expectMaxAge != null ? String(initialData.expectMaxAge) : "",
    expectArea: initialData?.expectArea || "",
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
        photos: form.photos,
        expectMinAge: form.expectMinAge ? parseInt(form.expectMinAge, 10) : null,
        expectMaxAge: form.expectMaxAge ? parseInt(form.expectMaxAge, 10) : null,
        expectArea: form.expectArea || null,
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
            <AreaCascader value={form.area} onChange={(v) => setForm({ ...form, area: v })} />
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
          <div className="space-y-2 md:col-span-2">
            <Label>照片（最多 6 张）</Label>
            <ImageUploader value={form.photos} onChange={(urls) => setForm({ ...form, photos: urls })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>基本情况介绍</Label>
            <Textarea value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} />
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
            <Label>其他要求</Label>
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
