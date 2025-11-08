// src/components/Matches.tsx
"use client";
import useSWR from "swr";
import { useMemo, useState, useEffect, useRef } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MatchItem = {
  id: string;
  when: string;
  characterName: string;
  characterLevel: number;
  characterClass: string;
  avatar: string;
  isMine: boolean;
};

export default function Matches({
  serverId,
  questId,
}: {
  serverId: number | null;
  questId: number | null;
}) {
  const url = useMemo(() => {
    if (!serverId || !questId) return null;
    return `/api/matches?serverId=${serverId}&questId=${questId}`;
  }, [serverId, questId]);

  const { data, isLoading, mutate, error } = useSWR<MatchItem[]>(url, fetcher, {
    refreshInterval: 10000,
  });

  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = useMemo(
    () => (data ? [...data].sort((a, b) => (a.isMine === b.isMine ? 0 : a.isMine ? -1 : 1)) : []),
    [data]
  );

  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function onItemClick(m: MatchItem) {
    try {
      await navigator.clipboard.writeText(`/w ${m.characterName} `);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setCopied(false);
      requestAnimationFrame(() => {
        setCopied(true);
        timerRef.current = window.setTimeout(() => setCopied(false), 5000);
      });
    } catch {}
  }

  async function remove(id: string) {
    if (!data) return;
    setDeleting(id);

    // 🔮 Optimistic UI
    const optimistic = data.filter((x) => x.id !== id);
    await mutate(optimistic, { revalidate: false });

    const res = await fetch(`/api/selection/${id}`, { method: "DELETE" });

    if (!res.ok) {
      // rollback si erreur
      await mutate(); // re-fetch depuis le serveur
    } else {
      // succès → revalider tranquillement
      await mutate();
    }
    setDeleting(null);
  }

  if (!serverId || !questId) return null;
  if (isLoading) return <div>Chargement…</div>;
  if (error) return <div className="card">Erreur lors du chargement.</div>;
  if (!data?.length)
    return <div className="card">Aucun joueur trouvé (pour l’instant).</div>;


  return (
    <>
      <div>
        {sorted.map((m) => (
          <div key={m.id} className="card match-card" onClick={() => onItemClick(m)}>
            <div className="match-row">
              <div className="match-col1 match-avatar">
                <img src={m.avatar} alt={m.characterClass} className="match-img" />
              </div>

              <div className="match-col2">
                <div className="match-name">{m.characterName}</div>
                <div className="match-class">{m.characterClass}</div>
              </div>

              <div className="match-col3">
                <div className="match-level">niv. {m.characterLevel}</div>
                {m.isMine && (
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(m.id); }}
                    disabled={deleting === m.id}
                    className="match-delete"
                  >
                    {deleting === m.id ? "Suppression…" : "Supprimer"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={"copied-toast" + (copied ? " is-visible" : "")}>Copié</div>
    </>
  );
}
