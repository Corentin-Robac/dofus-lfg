// src/components/ClientBlock.tsx
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ClientBlock() {
  const { mutate: globalMutate } = useSWRConfig();

  // --- Données principales
  const { data: chars } = useSWR<CharactersData>("/api/characters", fetcher);
  const active =
    chars?.characters?.find((c) => c.id === chars?.activeCharacterId) || null;

  const { data: servers } = useSWR<Server[]>("/api/servers", fetcher);

  // État UI
  const [quest, setQuest] = useState<{ id: number; name: string } | null>(null);

  // Fallback serveur pour invités / sans perso actif
  const [guestServerId, setGuestServerId] = useState<number | null>(null);

  // Auto-sélectionne le premier serveur dispo si pas de perso actif
  useEffect(() => {
    if (!active && servers?.length && guestServerId === null) {
      setGuestServerId(servers[0].id);
    }
  }, [active, servers, guestServerId]);

  // Serveur courant utilisé (perso actif sinon select invité)
  const serverIdUsed = active?.serverId ?? guestServerId ?? null;

  const serverNameUsed = useMemo(() => {
    if (!serverIdUsed) return "";
    const s = servers?.find((x) => x.id === serverIdUsed);
    return s ? s.name : `Serveur #${serverIdUsed}`;
  }, [serverIdUsed, servers]);

  // Image de classe (placeholder Cra si invité)
  const classSlug = (active?.class || "Cra").toLowerCase().replace("â", "a");
  const avatarSrc = `/images/classes/${classSlug}.png`;

  // --- Data matches
  const { data: selections } = useSWR<Selection[]>(
    quest?.id && serverIdUsed
      ? `/api/matches?serverId=${serverIdUsed}&questId=${quest.id}`
      : null,
    fetcher
  );

  async function addSelection() {
    if (!quest?.id || !serverIdUsed || !active) return;
    await fetch("/api/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: serverIdUsed, questId: quest.id }),
    });

    // Revalidation des listes
    globalMutate(
      (key: any) =>
        typeof key === "string" &&
        (key.startsWith(
          `/api/matches?serverId=${serverIdUsed}&questId=${quest.id}`
        ) ||
          key === "/api/characters")
    );
  }

  const canInteract = Boolean(active && serverIdUsed && quest?.id);

  // Personnage actif en tête de liste
  const sortedSelections = useMemo(() => {
    if (!selections) return [];
    if (!active) return selections;
    return [
      ...selections.filter((s) => s.characterId === active.id),
      ...selections.filter((s) => s.characterId !== active.id),
    ];
  }, [selections, active]);

  return (
    <div className="screen main-bg">
      {/* Colonne gauche */}
      <div className="col-left">
        {/* Carte héro / recherche */}
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
              <h3 className="hero-name">{active ? active.name : "Invité"}</h3>

              {/* Serveur : pill si connecté, sinon <ServerSelect /> */}
              <div className="server-line">
                {active ? (
                  <span className="server-pill">{serverNameUsed}</span>
                ) : (
                  <ServerSelect
                    value={guestServerId}
                    onChange={setGuestServerId}
                    servers={servers}
                  />
                )}
              </div>

              {/* Sélecteur de quête */}
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

        {/* Mes personnages (hauteur fixe + scroll interne) */}
        <div className="mychars-wrap mychars--fixed">
          <div style={{ padding: "0 4px 8px 4px" }}>
            <h3 className="panel-title" style={{ margin: 0 }}>
              Mes personnages
            </h3>
          </div>
          <div className="mychars-scroll">
            <MyCharactersCard />
          </div>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="col-right">
        <div className="panel-right">
          <div className="panel-right-head">
            <h3 className="panel-title">Joueurs sur la même quête</h3>
            <div className="results">
              {selections
                ? `${selections.length} résultat${
                    selections.length > 1 ? "s" : ""
                  }`
                : "0 résultat"}
            </div>
          </div>

          <div className="panel-right-scroll">
            <Matches
              serverId={serverIdUsed}
              questId={quest?.id ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
