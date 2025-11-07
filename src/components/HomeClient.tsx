"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import QuestAutocomplete from "@/components/QuestAutocomplete";
import Matches from "@/components/Matches";
import MyCharactersCard from "@/components/MyCharactersCard";
import ServerSelect from "@/components/ServerSelect";

type Character = {
  id: string;
  serverId: number;
  name: string;
  level: number;
  class: string;
};

type CharactersData = {
  activeCharacterId: string | null;
  characters: Character[];
};

type Server = { id: number; name: string; kind: string };
type Selection = {
  id: string;
  characterId: string;
  questId: number;
  serverId: number;
  character: Character;
};

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });

export default function HomeClient() {
  const { mutate: globalMutate } = useSWRConfig();

  // --- Persos (si 401 => invité)
  const { data: chars } = useSWR<CharactersData>("/api/characters", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });
  const active =
    chars?.characters?.find((c) => c.id === chars?.activeCharacterId) || null;

  // --- Serveurs (public)
  const { data: servers, isLoading: serversLoading } = useSWR<Server[]>(
    "/api/servers",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // --- Serveur pour invité
  const [guestServerId, setGuestServerId] = useState<number | null>(null);

  // Toujours forcer une valeur par défaut dès que la liste arrive
  useEffect(() => {
    if (!active && servers?.length && guestServerId === null) {
      setGuestServerId(servers[0].id);
    }
  }, [active, servers, guestServerId]);

  const serverIdUsed = active?.serverId ?? guestServerId ?? null;
  const serverNameUsed = useMemo(() => {
    if (!serverIdUsed) return "";
    return (
      servers?.find((s) => s.id === serverIdUsed)?.name ??
      `Serveur #${serverIdUsed}`
    );
  }, [serverIdUsed, servers]);

  // --- Quête
  const [quest, setQuest] = useState<{ id: number; name: string } | null>(null);

  // --- Inscriptions
  const { data: selections } = useSWR<Selection[]>(
    quest?.id && serverIdUsed
      ? `/api/matches?serverId=${serverIdUsed}&questId=${quest.id}`
      : null,
    fetcher
  );
  const resultsCount = selections?.length ?? 0;

  // --- Ajouter (désactivé si invité)
  const canInteract = Boolean(active && serverIdUsed && quest?.id);

  async function addSelection() {
    if (!canInteract || !quest?.id || !serverIdUsed) return;
    await fetch("/api/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: serverIdUsed, questId: quest.id }),
    });
    globalMutate(
      (key: any) =>
        typeof key === "string" &&
        (key.startsWith(
          `/api/matches?serverId=${serverIdUsed}&questId=${quest.id}`
        ) ||
          key === "/api/characters")
    );
  }

  // --- Avatar (placeholder Cra si invité)
  const classSlug = (active?.class || "Cra").toLowerCase().replace("â", "a");
  const avatarSrc = `/images/classes/${classSlug}.png`;

  return (
    <>
      {/* Colonne gauche */}
      <section className="col-left">
        {/* Carte personnage + quête */}
        <div className="hero-card">
          <div className="hero-header">
            <img
              src={avatarSrc}
              alt={active?.class ?? "Cra"}
              className="hero-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/classes/cra.png";
              }}
            />
            <div className="hero-meta">
              <div className="hero-name">{active ? active.name : "Invité"}</div>

              {/* Serveur : pill si connecté, select si invité */}
              <div className="server-line">
                {active ? (
                  <span className="server-pill">{serverNameUsed}</span>
                ) : (
                  <>
                    {/* Always show a visible select in guest mode */}
                    {servers?.length ? (
                      <ServerSelect
                        value={guestServerId}
                        onChange={setGuestServerId}
                      />
                    ) : (
                      <select className="server-select" disabled>
                        <option>Chargement des serveurs…</option>
                      </select>
                    )}
                  </>
                )}
              </div>

              {/* Quête */}
              <div className="hero-field">
                <QuestAutocomplete value={quest} onChange={setQuest} />
              </div>

              {/* CTA */}
              <div className="hero-actions">
                <button
                  className="btn-gold"
                  onClick={addSelection}
                  disabled={!canInteract}
                >
                  Ajouter
                </button>
                {!active && (
                  <span className="hint">
                    Connectez-vous et créez un personnage pour suivre des
                    quêtes.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mes personnages (fixed height with internal scroll) */}
        <div className="mychars-wrap mychars--fixed">
          <div className="mychars-scroll">
            {active ? (
              <MyCharactersCard />
            ) : (
              <div className="empty-panel">
                <div className="panel-title" style={{ marginBottom: 8 }}>
                  Mes personnages
                </div>
                <div className="empty-text">
                  Aucun personnage. Connectez-vous pour en créer un.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Colonne droite : toujours fixe/visible même vide */}
      <aside className="col-right">
        <div className="panel-right">
          <div className="panel-right-head">
            <h3 className="panel-title">Disponibles pour la quête</h3>
            <div className="results">
              {resultsCount} résultat{resultsCount > 1 ? "s" : ""}
            </div>
          </div>
          <div className="panel-right-scroll">
            {quest?.id && serverIdUsed ? (
              <Matches serverId={serverIdUsed} questId={quest.id} />
            ) : (
              <div className="empty-text">
                Sélectionnez un serveur et une quête pour voir les joueurs
                disponibles.
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
