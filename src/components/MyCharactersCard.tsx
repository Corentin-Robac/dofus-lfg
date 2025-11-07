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

  function serverName(id: number) {
    return servers?.find((s) => s.id === id)?.name ?? `Serveur #${id}`;
  }

  async function setActive(id: string) {
    const res = await fetch("/api/characters/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: id }),
    });
    if (!res.ok) return; // on ne bloque pas l’UI avec des alerts
    // 1) refresh /api/characters
    await mutate();
    // 2) revalider les listes dépendantes : matches et header
    globalMutate(
      (key: any) =>
        typeof key === "string" &&
        (key.startsWith("/api/matches?") ||
          key === "/api/characters" ||
          key === "/api/servers")
    );
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>Mes personnages</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {data.characters.map((c) => {
          const imgSlug = (c.class || "Cra").toLowerCase().replace("â", "a");
          const imgSrc = `/images/classes/${imgSlug}.png`;
          const active = data.activeCharacterId === c.id;
          return (
            <div
              key={c.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 8,
              }}
            >
              <img
                src={imgSrc}
                alt={c.class}
                width={36}
                height={36}
                style={{ borderRadius: 6, objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/classes/cra.png";
                }}
              />
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ color: "#555" }}>niv. {c.level}</div>
              <div style={{ color: "#555" }}>{c.class}</div>
              <div style={{ color: "#777" }}>{serverName(c.serverId)}</div>
              <div style={{ marginLeft: "auto" }}>
                {active ? (
                  <span style={{ fontSize: 12, color: "#2a7" }}>Actif</span>
                ) : (
                  <button onClick={() => setActive(c.id)}>Activer</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
