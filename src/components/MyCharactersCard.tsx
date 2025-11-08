// src/components/MyCharactersCard.tsx
"use client";

import useSWR from "swr";
import { useSWRConfig } from "swr";

type Character = {
  id: string;
  serverId: number;
  name: string;
  level: number;
  class: string;
  serverName?: string;
};

type CharactersData = {
  activeCharacterId: string | null;
  characters: Character[];
};

type Server = { id: number; name: string; kind: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MyCharactersCard() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, mutate } = useSWR<CharactersData>("/api/characters", fetcher);
  const { data: servers } = useSWR<Server[]>("/api/servers", fetcher);

  if (!data) return null;
  if (!data.characters.length) return null;

  function getServerName(c: Character) {
    if (c.serverName) return c.serverName;
    const s = servers?.find((x) => x.id === c.serverId);
    return s ? s.name : `Serveur #${c.serverId}`;
  }

  async function setActive(id: string) {
    await fetch("/api/characters/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: id }),
    });
    await mutate();
    globalMutate((key: any) => typeof key === "string" && (key.startsWith("/api/matches?") || key === "/api/characters"));
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActive(id);
    }
  }

  return (
    <div className="mychars-grid">
      {data.characters.map((c) => {
        const imgSlug = (c.class || "Cra").toLowerCase().replace("â", "a");
        const imgSrc = `/images/classes/${imgSlug}.png`;
        const active = data.activeCharacterId === c.id;
        return (
          <div
            key={c.id}
            className="mychars-item"
            role="button"
            tabIndex={0}
            onClick={() => setActive(c.id)}
            onKeyDown={(e) => onKey(e, c.id)}
          >
            <div className="mychars-item-row">
              <img
                src={imgSrc}
                alt={c.class}
                width={40}
                height={40}
                style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/classes/cra.png";
                }}
              />

              <div style={{ minWidth: 0 }}>
                <div className="mychars-item-name" title={c.name}>
                  {c.name}
                </div>
                <div className="mychars-item-server">{getServerName(c)}</div>
              </div>

              <div className="mychars-item-right">
                <div className="mychars-item-level">{c.level}</div>
                <div className={`mychars-item-active ${active ? "is-active" : ""}`}>
                  {active ? "Actif" : "\u00A0"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
