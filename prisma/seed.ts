// prisma/seed.ts
import { prisma } from "../src/lib/prisma";

// Mise à jour de la liste des serveurs
const SERVERS = [
  // Pionnier multi
  { id: 101, name: "Brial", region: "FR", kind: "pionnier multi" },
  { id: 102, name: "Rafal", region: "FR", kind: "pionnier multi" },
  { id: 103, name: "Salar", region: "FR", kind: "pionnier multi" },

  // Pionnier mono
  { id: 201, name: "Dakal", region: "FR", kind: "pionnier mono" },
  { id: 202, name: "Kourial", region: "FR", kind: "pionnier mono" },
  { id: 203, name: "Mikhal", region: "FR", kind: "pionnier mono" },

  // Classique
  { id: 301, name: "Hel Mina", region: "FR", kind: "classique" },
  { id: 302, name: "Orukam", region: "FR", kind: "classique" },
  { id: 303, name: "Imagiro", region: "FR", kind: "classique" },
  { id: 304, name: "Tal Kasha", region: "FR", kind: "classique" },
  { id: 305, name: "Tylezia", region: "FR", kind: "classique" },

  // Classique mono
  { id: 401, name: "Draconiros", region: "FR", kind: "classique mono" },

  // Epique
  { id: 501, name: "Ombre", region: "FR", kind: "Epique" },
];

async function main() {
  const ids = SERVERS.map((s) => s.id);

  await prisma.$transaction([
    prisma.server.deleteMany({ where: { id: { notIn: ids } } }),
    ...SERVERS.map((s) =>
      prisma.server.upsert({
        where: { id: s.id },
        update: { name: s.name, region: s.region, kind: s.kind },
        create: s,
      })
    ),
  ]);

  console.log("✅ Servers synced with seed list.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
