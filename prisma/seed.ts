// prisma/seed.ts
import { prisma } from "../src/lib/prisma";

const SERVERS = [
  // Mono-compte FR
  { id: 201, name: "Ilyzaelle", region: "FR", kind: "mono" },
  // Classic FR (exemples courants)
  { id: 301, name: "Jahash", region: "FR", kind: "classic" },
  { id: 302, name: "Orukam", region: "FR", kind: "classic" },
  { id: 303, name: "Imagiro", region: "FR", kind: "classic" },
];

async function main() {
  await prisma.server.createMany({ data: SERVERS, skipDuplicates: true });
  console.log("✅ Servers seeded.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
