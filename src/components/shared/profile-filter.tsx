"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ProfileFilterValue {
  gender: string;
  minAge: string;
  maxAge: string;
  area: string;
  sort: "newest" | "compatibility";
}

export const EMPTY_FILTER: ProfileFilterValue = { gender: "", minAge: "", maxAge: "", area: "", sort: "newest" };

export function ProfileFilter({
  value,
  onChange,
  onSearch,
  showGender = true,
  showSort = false,
  onSortChange,
}: {
  value: ProfileFilterValue;
  onChange: (v: ProfileFilterValue) => void;
  onSearch: () => void;
  /**
   * Whether to render the gender dropdown. The user-facing wall filters by
   * the viewer's opposite gender server-side, so it hides the control; the
   * admin match view keeps it.
   */
  showGender?: boolean;
  /**
   * Whether to render the newest/compatibility sort toggle. Only the
   * user-facing wall supports compatibility sorting; the admin match view
   * hides it.
   */
  showSort?: boolean;
  /**
   * Called when the user clicks a sort option. When provided, the wall can
   * reload immediately (resetting to page 1) instead of waiting for 筛选.
   */
  onSortChange?: (sort: "newest" | "compatibility") => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={cn(
            "grid gap-3",
            showGender ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3",
          )}
        >
          {showGender && (
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={value.gender}
              onChange={(e) => onChange({ ...value, gender: e.target.value })}
            >
              <option value="">全部性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          )}
          <Input placeholder="最小年龄" type="number" value={value.minAge} onChange={(e) => onChange({ ...value, minAge: e.target.value })} />
          <Input placeholder="最大年龄" type="number" value={value.maxAge} onChange={(e) => onChange({ ...value, maxAge: e.target.value })} />
          <Input placeholder="地区" value={value.area} onChange={(e) => onChange({ ...value, area: e.target.value })} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={onSearch}>筛选</Button>
          {showSort && (
            <div className="flex items-center rounded-md border border-input overflow-hidden">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  value.sort === "newest" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                )}
                onClick={() => (onSortChange ? onSortChange("newest") : onChange({ ...value, sort: "newest" }))}
              >
                最新
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  value.sort === "compatibility" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                )}
                onClick={() => (onSortChange ? onSortChange("compatibility") : onChange({ ...value, sort: "compatibility" }))}
              >
                匹配度优先
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
