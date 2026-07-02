"use client";

import { regionData } from "element-china-area-data";

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function AreaCascader({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const parts = value ? value.split("/") : [];
  const provinceLabel = parts[0] || "";
  const cityLabel = parts[1] || "";
  const districtLabel = parts[2] || "";

  const province = regionData.find((p) => p.label === provinceLabel);
  const cities = province?.children || [];
  const city = cities.find((c) => c.label === cityLabel);
  const districts = city?.children || [];

  function update(p: string, c: string, d: string) {
    onChange([p, c, d].filter(Boolean).join("/"));
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        className={selectClass}
        value={provinceLabel}
        onChange={(e) => update(e.target.value, "", "")}
      >
        <option value="">请选择</option>
        {regionData.map((p) => (
          <option key={p.value} value={p.label}>{p.label}</option>
        ))}
      </select>
      <select
        className={selectClass}
        value={cityLabel}
        onChange={(e) => update(provinceLabel, e.target.value, "")}
        disabled={!province}
      >
        <option value="">请选择</option>
        {cities.map((c) => (
          <option key={c.value} value={c.label}>{c.label}</option>
        ))}
      </select>
      <select
        className={selectClass}
        value={districtLabel}
        onChange={(e) => update(provinceLabel, cityLabel, e.target.value)}
        disabled={!city || districts.length === 0}
      >
        <option value="">请选择</option>
        {districts.map((d) => (
          <option key={d.value} value={d.label}>{d.label}</option>
        ))}
      </select>
    </div>
  );
}
