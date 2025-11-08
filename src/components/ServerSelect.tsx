// src/components/ServerSelect.tsx
"use client";

import { useEffect, useRef, useState } from "react";

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
  const list = servers as Server[]; // safe after guard above

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedIndex = Math.max(
    0,
    list.findIndex((s) => s.id === value)
  );
  const selected = list[selectedIndex] ?? list[0];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(idx: number) {
    const s = list[idx];
    if (!s) return;
    onChange(s.id);
    setOpen(false);
    setActiveIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      setActiveIdx(selectedIndex);
      return;
    }
    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(list.length - 1, (i < 0 ? selectedIndex : i) + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, (i < 0 ? selectedIndex : i) - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(activeIdx >= 0 ? activeIdx : selectedIndex);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  return (
    <div ref={containerRef} className="octo-field">
      <label className="octo-label">Serveur</label>
      <div className="octo-input-wrap">
        <button
          type="button"
          className="octo-input octo-input--button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            setOpen((o) => !o);
            setActiveIdx(selectedIndex);
          }}
          onKeyDown={onKeyDown}
        >
          {selected.name} ({selected.kind})
        </button>
      </div>

      {open && (
        <div className="octo-panel" role="listbox">
          {list.map((s, idx) => (
            <div
              key={s.id}
              role="option"
              aria-selected={value === s.id}
              className={
                "octo-item" +
                (idx === activeIdx ? " is-active" : "")
              }
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(idx)}
            >
              {s.name} ({s.kind})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
