// app/api/quests/search/route.ts
export const runtime = 'nodejs'

import { prisma } from "@/lib/prisma";

function sanitizeQuery(input: string) {
  const s = input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "") // retire contrôles ASCII
    .trim();
  return s.slice(0, 50); // borne max
}

// Rate limit léger: 20 req / 60s / IP (in-memory)
const rlStore = new Map<string, number[]>();
const RL_LIMIT = 20;
const RL_WINDOW_MS = 60_000;
function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0].trim();
  return ip || req.headers.get("cf-connecting-ip") || "anon";
}
function hitRateLimit(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();
  const arr = rlStore.get(ip) ?? [];
  const fresh = arr.filter((t) => now - t < RL_WINDOW_MS);
  if (fresh.length >= RL_LIMIT) return true;
  fresh.push(now);
  rlStore.set(ip, fresh);
  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const q = sanitizeQuery(raw);

  if (!q) {
    const first100 = await prisma.quest.findMany({
      take: 100,
      orderBy: { name: "asc" },
    });
    return Response.json(first100);
  }

  const rows = await prisma.quest.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 50,
    orderBy: { name: "asc" },
  });

  return Response.json(rows);
}
