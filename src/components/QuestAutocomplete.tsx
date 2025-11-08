// src/components/QuestAutocomplete.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

type Quest = { id: number; name: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function QuestAutocomplete({
  value,
  onChange,
  placeholder = "Rechercher une quête…",
}: {
  value: Quest | null;
  onChange: (q: Quest | null) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 🔹 debounce 200ms pour limiter les appels API
  const debounced = useDebounced(input, 200);

  // On déclenche la recherche si l’utilisateur tape au moins 1 caractère,
  // sinon l’API renvoie déjà un échantillon (ex: 100 premières quêtes).
  const key =
    debounced.trim().length > 0
      ? `/api/quests/search?q=${encodeURIComponent(debounced.trim())}`
      : `/api/quests/search`;

  const { data: results, isLoading } = useSWR<Quest[]>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  // Synchronise l'input si la valeur change depuis l’extérieur
  useEffect(() => {
    if (value?.name && value.name !== input) setInput(value.name);
    if (!value && input && !open) {
      // laisser l'utilisateur taper sans override si pas ouvert
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fermer le panneau si on clique en dehors
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

  // Navigation clavier
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    const items = results ?? [];
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(items.length - 1, activeIdx + 1);
      setActiveIdx(next);
      scrollItemIntoView(next);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(0, activeIdx - 1);
      setActiveIdx(prev);
      scrollItemIntoView(prev);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = activeIdx >= 0 ? items[activeIdx] : items[0];
      if (pick) {
        onChange(pick);
        setInput(pick.name);
        setOpen(false);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function selectQuest(q: Quest) {
    onChange(q);
    setInput(q.name);
    setOpen(false);
    setActiveIdx(-1);
  }

  function clearSelection() {
    onChange(null);
    setInput("");
    setOpen(true);
    setActiveIdx(-1);
  }

  function scrollItemIntoView(idx: number) {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLDivElement>(`[data-idx="${idx}"]`);
    if (!el) return;
    const { offsetTop, offsetHeight } = el;
    const { scrollTop, clientHeight } = list;
    if (offsetTop < scrollTop) {
      list.scrollTop = offsetTop;
    } else if (offsetTop + offsetHeight > scrollTop + clientHeight) {
      list.scrollTop = offsetTop + offsetHeight - clientHeight;
    }
  }

  const items = useMemo(() => {
   const arr = results ?? [];
   return arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
 }, [results]);

  return (
    <div ref={containerRef} className="octo-field">
      <label className="octo-label">Quête</label>
      <div className={"octo-input-wrap" + (value ? " octo-input-wrap--no-chev" : "")}>
        <input
          className="octo-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="octo-clear"
            onClick={clearSelection}
            title="Effacer"
            aria-label="Effacer la sélection"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div ref={listRef} className="octo-panel">
          {isLoading && <div className="octo-empty">Chargement…</div>}
          {!isLoading && !items.length && (
            <div className="octo-empty">Aucun résultat</div>
          )}

          {items.map((q, idx) => (
            <div
              key={q.id}
              data-idx={idx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => selectQuest(q)}
              className={"octo-item" + (activeIdx === idx ? " is-active" : "")}
            >
              {q.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
