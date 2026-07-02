"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Lightweight photo carousel for a profile's photo list. Renders a main
 * image with prev/next controls and a thumbnail strip below. Falls back
 * to a placeholder when there are no photos.
 */
export function PhotoGallery({ photosJson, name }: { photosJson: string; name: string }) {
  const photos = parsePhotos(photosJson);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-lg bg-muted flex items-center justify-center text-muted-foreground/60 text-sm">
        暂无照片
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted relative">
        <Image
          src={photos[0]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 480px"
        />
      </div>
    );
  }

  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted group">
        <Image
          src={photos[index]}
          alt={`${name} 照片 ${index + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />
        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          aria-label="上一张"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          aria-label="下一张"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="absolute bottom-2 right-2 text-xs text-white bg-black/50 rounded px-2 py-0.5">
          {index + 1} / {photos.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
              i === index ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
            }`}
            aria-label={`查看第 ${i + 1} 张`}
          >
            <Image src={src} alt={`缩略图 ${i + 1}`} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  );
}

function parsePhotos(photosJson: string): string[] {
  try {
    const arr = JSON.parse(photosJson || "[]");
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}
