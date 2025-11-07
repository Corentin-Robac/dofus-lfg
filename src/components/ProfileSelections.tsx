// src/components/ProfileSelections.tsx
"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Row = {
  id: string;
  when: string;
  questId: number;
  questName: string;
  serverId: number;
  serverName: string;
  characterId: string;
  characterName: string;
  characterLevel: number;
  characterClass: string;
};

export default function ProfileSelections() {
  const { data: chars } = useSWR<{
    activeCharacterId: string | null;
    characters: any[];
  }>("/api/characters", fetcher);
  const activeId = chars?.activeCharacterId ?? "";

  // ✅ la clé dépend de l'actif → refetch automatique quand on change de perso
  const { data, isLoading, mutate, error } = useSWR<Row[]>(
    `/api/my-selections?c=${activeId}`,
    fetcher
  );

  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    if (!data) return;
    setDeleting(id);
    const optimistic = data.filter((x) => x.id !== id);
    await mutate(optimistic, { revalidate: false });

    const res = await fetch(`/api/selection/${id}`, { method: "DELETE" });
    await mutate(); // rollback (si !ok) ou revalidation
    setDeleting(null);
  }

  if (!activeId) {
    return (
      <div
        className="card"
        style={{ background: "#fffbe6", borderColor: "#eedc82" }}
      >
        ⚠️ Aucun personnage actif. Sélectionnez-en un pour voir vos
        inscriptions.
      </div>
    );
  }
  if (isLoading) return <div>Chargement…</div>;
  if (error) return <div className="card">Erreur lors du chargement.</div>;
  if (!data?.length)
    return <div>Aucune inscription pour votre personnage actif.</div>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {data.map((r) => (
        <div
          key={r.id}
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>
              {r.questName} — {r.serverName}
            </div>
            <div style={{ color: "#555" }}>
              {r.characterName} — niv. {r.characterLevel} — {r.characterClass}
            </div>
            <div style={{ fontSize: 12, color: "#777" }}>
              {new Date(r.when).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          </div>
          <button
            onClick={() => remove(r.id)}
            disabled={deleting === r.id}
            style={{ color: "#a22", opacity: deleting === r.id ? 0.6 : 1 }}
          >
            {deleting === r.id ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      ))}
    </div>
  );
}
