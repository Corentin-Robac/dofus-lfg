// src/components/ServerSelect.tsx
"use client";

type Server = { id: number; name: string; kind: string };

export default function ServerSelect({
  value,
  onChange,
  servers,
}: {
  value: number | null;
  onChange: (id: number) => void;
  servers?: Server[];
}) {
  if (!servers?.length) return null;
  return (
    <select
      value={value ?? servers[0].id}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%" }}
    >
      {servers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.kind})
        </option>
      ))}
    </select>
  );
}
