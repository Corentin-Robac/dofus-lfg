// src/components/Matches.tsx
"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";

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
    <div>
      <h3>Joueurs sur la même quête</h3>
      {data.map((m) => (
        <div
          key={m.id}
          className="card"
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <img
            src={m.avatar}
            alt={m.characterClass}
            width={40}
            height={40}
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>
              {m.characterName} — niv. {m.characterLevel} — {m.characterClass}
            </div>
            <div style={{ fontSize: 12, color: "#777" }}>
              {new Date(m.when).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          </div>

          {m.isMine && (
            <button
              onClick={() => remove(m.id)}
              disabled={deleting === m.id}
              style={{ color: "#a22", opacity: deleting === m.id ? 0.6 : 1 }}
            >
              {deleting === m.id ? "Suppression…" : "Supprimer"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
