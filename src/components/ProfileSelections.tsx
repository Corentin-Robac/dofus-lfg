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
    characters: { id: string; name: string }[];
  }>("/api/characters", fetcher);
  const activeId = chars?.activeCharacterId ?? "";
  const activeName = chars?.characters?.find(c => c.id === activeId)?.name || "—";

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
      <>
        <div className="panel-right-head">
          <h2 className="panel-title">Quêtes suivies</h2>
        </div>
        <div className="panel-right-scroll">
          <div className="card" style={{ background: "#011D1B", borderColor: "#eedc82" }}>
            ⚠️ Aucun personnage actif. Sélectionnez-en un pour voir vos inscriptions.
          </div>
        </div>
      </>
    );
  }
  if (isLoading) return <div>Chargement…</div>;
  if (error) return <div className="card">Erreur lors du chargement.</div>;

  return (
    <>
      <div className="panel-right-head">
        <h2 className="panel-title">Quêtes suivies de {activeName}</h2>
      </div>
      <div className="panel-right-scroll">
        {(!data || data.length === 0) && (
          <div className="card">Aucune inscription pour votre personnage actif.</div>
        )}
        {data?.map((r) => (
          <div key={r.id} className="match-card">
            <div className="match-row" style={{ alignItems: "center" }}>
              <div className="match-col2" style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div
                  className="match-name"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  title={`${r.questName} — ${r.serverName}`}
                >
                  {r.questName} — {r.serverName}
                </div>
                <div className="match-class" style={{ fontSize: 12 }}>
                  {new Date(r.when).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
              <div className="match-col3" style={{ flex: "0 0 auto" }}>
                <button
                  className="btn btn--ghost btn--danger btn--sm btn--noborder"
                  onClick={() => remove(r.id)}
                  disabled={deleting === r.id}
                >
                  {deleting === r.id ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
