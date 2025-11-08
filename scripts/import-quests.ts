// scripts/import-quests.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

// Par défaut on lit data/quests.fr.json (modifiable via DOFUS_QUESTS_FILE)
const defaultPath = path.join(process.cwd(), "data", "quests.fr.json");
const FILE = process.env.DOFUS_QUESTS_FILE || defaultPath;

type QuestRow = {
  id: number;
  name: string;
  category?: string | null;
  level?: number | null;
  area?: string | null;
};

function assertRow(x: any, i: number): asserts x is QuestRow {
  if (typeof x?.id !== "number")
    throw new Error(`Ligne ${i}: "id" doit être un nombre`);
  if (typeof x?.name !== "string" || !x.name.trim())
    throw new Error(`Ligne ${i}: "name" requis`);
}

async function run() {
  console.log("📄 Lecture du fichier JSON:", FILE);

  if (!fs.existsSync(FILE)) {
    console.error("❌ Fichier introuvable:", FILE);
    console.error(
      'Crée "data/quests.fr.json" ou définis DOFUS_QUESTS_FILE vers ton fichier.'
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(FILE, "utf-8");
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error(
      "❌ JSON invalide. Vérifie la syntaxe (virgules, guillemets…)."
    );
    throw e;
  }

  if (!Array.isArray(arr)) {
    console.error("❌ Le fichier doit contenir un tableau JSON de quêtes.");
    process.exit(1);
  }

  // Validation + normalisation légère
  const rows: QuestRow[] = arr.map((x, i) => {
    assertRow(x, i);
    return {
      id: x.id,
      name: x.name.trim(),
      category: x.category ?? null,
      level: x.level ?? null,
      area: x.area ?? null,
    };
  });

  if (rows.length === 0) {
    console.warn("⚠️ Aucun élément dans le JSON. Rien à importer.");
    process.exit(0);
  }

  const ids = rows.map((r) => r.id);

  await prisma.$transaction(async (tx) => {
    await tx.selection.deleteMany({ where: { questId: { notIn: ids } } });
    await tx.quest.deleteMany({ where: { id: { notIn: ids } } });

    const existing = await tx.quest.findMany({
      select: { id: true },
      where: { id: { in: ids } },
    });
    const existingSet = new Set(existing.map((q) => q.id));

    const toCreate = rows.filter((r) => !existingSet.has(r.id));
    if (toCreate.length) {
      await tx.quest.createMany({ data: toCreate });
    }

    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows
        .slice(i, i + chunkSize)
        .filter((r) => existingSet.has(r.id));
      for (const r of chunk) {
        await tx.quest.update({
          where: { id: r.id },
          data: {
            name: r.name,
            category: r.category,
            level: r.level,
            area: r.area,
          },
        });
      }
    }
  });

  console.log("🎉 Import terminé depuis JSON.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
