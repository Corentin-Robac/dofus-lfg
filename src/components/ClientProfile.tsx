// src/components/ClientProfile.tsx
"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";

type Character = {
  id: string;
  serverId: number;
  serverName: string;
  name: string;
  level: number;
  class: string;
};

type Data = {
  activeCharacterId: string | null;
  characters: Character[];
};

type Server = { id: number; name: string; kind: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CLASSES = [
  "Feca",
  "Osamodas",
  "Enutrof",
  "Sram",
  "Xelor",
  "Ecaflip",
  "Eniripsa",
  "Iop",
  "Crâ",
  "Sadida",
  "Sacrieur",
  "Pandawa",
  "Roublard",
  "Zobal",
  "Steamer",
  "Eliotrope",
  "Huppermage",
  "Ouginak",
  "Forgelance",
] as const;

function classImage(c: string) {
  // place les placeholders correspondants dans /public/images/classes/<lower>.png
  return `/images/classes/${c.toLowerCase().replace("â", "a")}.png`;
}

function normalizeName(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function sanitizeNameInput(input: string) {
  const s = normalizeName(input);
  return s.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+/gu, "").slice(0, 40);
}

function validName(name: string) {
  // max 40, lettres (accentuées ok), tiret -, crochets [ ]
  if (name.length < 1 || name.length > 40) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+$/u.test(name);
}

export default function ClientProfile() {
  const { data, mutate } = useSWR<Data>("/api/characters", fetcher);
  const { data: servers } = useSWR<Server[]>("/api/servers", fetcher);

  // --- Formulaire d'ajout ---
  const [form, setForm] = useState({
    serverId: 0,
    name: "",
    level: 1,
    class: "Iop",
  });

  // Sélectionner un serveur par défaut (1er de la liste) au chargement
  useEffect(() => {
    if (servers?.length && !form.serverId) {
      setForm((f) => ({ ...f, serverId: servers[0].id }));
    }
  }, [servers, form.serverId]);

  const nameOk = useMemo(() => validName(form.name.trim()), [form.name]);
  const levelOk = form.level >= 1 && form.level <= 200;
  const canAdd = nameOk && levelOk && !!form.serverId;

  async function addCharacter() {
    if (!canAdd) return;
    const body = {
      serverId: Number(form.serverId),
      name: normalizeName(form.name),
      level: Number(form.level),
      class: form.class,
    };
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // affiche un petit message inline minimaliste
      console.error(await res.text());
      return;
    }
    await mutate();
    // reset (en gardant le serveur pré-sélectionné)
    setForm((f) => ({
      serverId: f.serverId,
      name: "",
      level: 1,
      class: "Iop",
    }));
  }

  async function setActive(id: string) {
    const res = await fetch("/api/characters/active", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: id }),
    });
    if (!res.ok) return;
    await mutate(); // rafraîchit la liste des persos
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Supprimer ce personnage ? Ses recherches seront aussi supprimées."
      )
    )
      return;
    const res = await fetch(`/api/characters/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await mutate();
  }

  // --- Edition inline ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{
    serverId: number;
    name: string;
    level: number;
    class: string;
  }>({
    serverId: 0,
    name: "",
    level: 1,
    class: "Iop",
  });

  function startEdit(ch: Character) {
    setEditingId(ch.id);
    setEdit({
      serverId: ch.serverId,
      name: ch.name,
      level: ch.level,
      class: ch.class,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const editNameOk = useMemo(() => validName(edit.name.trim()), [edit.name]);
  const editLevelOk = edit.level >= 1 && edit.level <= 200;
  const canSaveEdit = editNameOk && editLevelOk && !!edit.serverId;

  async function saveEdit(id: string) {
    if (!canSaveEdit) return;
    const res = await fetch(`/api/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serverId: edit.serverId,
        name: normalizeName(edit.name),
        level: edit.level,
        class: edit.class,
      }),
    });
    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    await mutate();
    setEditingId(null);
  }

  if (!data || !servers) return <div>Chargement…</div>;

  return (
    <div className="card">
      <h3>Ajouter un personnage</h3>
      <div className="profile-add-grid">
        <select
          value={form.serverId || (servers[0]?.id ?? 0)}
          onChange={(e) =>
            setForm((f) => ({ ...f, serverId: Number(e.target.value) }))
          }
        >
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.kind})
            </option>
          ))}
        </select>

        <input
          placeholder="Pseudo"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: sanitizeNameInput(e.target.value) }))}
          maxLength={40}
          pattern="^[A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+$"
          inputMode="text"
          autoComplete="off"
        />
        {!nameOk && form.name.length > 0 && (
          <div style={{ gridColumn: "1 / -1", color: "#a22", fontSize: 12 }}>
            Le nom doit contenir uniquement des lettres, des tirets (-) et des
            crochets [ ] (max 40).
          </div>
        )}

        <input
          type="number"
          min={1}
          max={200}
          placeholder="Niveau"
          value={form.level}
          onChange={(e) =>
            setForm((f) => ({ ...f, level: Number(e.target.value || 1) }))
          }
        />

        <select
          value={form.class}
          onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
        >
          {CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button className="btn btn--solid" onClick={addCharacter} disabled={!canAdd}>
          Ajouter
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Mes personnages</h3>
      {!data.characters.length && <div>Aucun personnage pour l’instant.</div>}

      <div style={{ display: "grid", gap: 8 }}>
        {data.characters.map((ch) => {
          const isEditing = editingId === ch.id;
          return (
            <div
              key={ch.id}
              className="card"
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
            >
            {/* ✅ Avatar de classe */}
            <img
              src={classImage(isEditing ? edit.class : ch.class)}
              alt={isEditing ? edit.class : ch.class}
              width={40}
              height={40}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />

            {!isEditing ? (
              <>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ch.name}>
                  {ch.name}
                </div>
                <div style={{ color: "#555" }}>Niv. {ch.level}</div>
                <div style={{ color: "#555" }}>{ch.class}</div>
                <div style={{ color: "#777" }}>Serveur {ch.serverName}</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  {data.activeCharacterId === ch.id ? (
                    <span style={{ fontSize: 12, color: "#2a7", alignSelf: "center" }}>Actif</span>
                  ) : (
                    <button className="btn btn--solid btn--sm" onClick={() => setActive(ch.id)}>
                      Sélectionner
                    </button>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={() => startEdit(ch)}>Modifier</button>
                  <button
                    className="btn btn--ghost btn--danger btn--sm"
                    onClick={() => remove(ch.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  value={edit.name}
                  onChange={(e) =>
                    setEdit((v) => ({ ...v, name: sanitizeNameInput(e.target.value) }))
                  }
                  maxLength={40}
                  placeholder="Pseudo"
                  pattern="^[A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+$"
                  inputMode="text"
                  autoComplete="off"
                  style={{ minWidth: 160 }}
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={edit.level}
                  onChange={(e) =>
                    setEdit((v) => ({
                      ...v,
                      level: Number(e.target.value || 1),
                    }))
                  }
                  style={{ width: 90 }}
                />
                <select
                  value={edit.class}
                  onChange={(e) =>
                    setEdit((v) => ({ ...v, class: e.target.value }))
                  }
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={edit.serverId}
                  onChange={(e) =>
                    setEdit((v) => ({ ...v, serverId: Number(e.target.value) }))
                  }
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.kind})
                    </option>
                  ))}
                </select>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button
                    className="btn btn--solid btn--sm"
                    onClick={() => saveEdit(ch.id)}
                    disabled={!canSaveEdit}
                  >
                    Enregistrer
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={cancelEdit}>Annuler</button>
                </div>

                {!editNameOk && edit.name.length > 0 && (
                  <div style={{ color: "#a22", fontSize: 12 }}>
                    Le nom doit contenir uniquement des lettres, des tirets (-)
                    et des crochets [ ] (max 40).
                  </div>
                )}
              </>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
