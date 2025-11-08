// app/api/matches/route.ts
export const runtime = 'nodejs'

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getClassImage } from "@/lib/classImages";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";

const Query = z.object({
  serverId: z.coerce.number().int().min(1),
  questId: z.coerce.number().int().min(1),
});

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
  const session = await getServerSession(authOptions);
  const meEmail = session?.user?.email ?? null;
  const me = meEmail
    ? await prisma.user.findUnique({
        where: { email: meEmail },
        select: { id: true, activeCharacterId: true },
      })
    : null;

  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({
    serverId: searchParams.get("serverId"),
    questId: searchParams.get("questId"),
  });
  if (!parsed.success) return new Response("Missing or invalid params", { status: 400 });
  const { serverId, questId } = parsed.data;

  type Row = Prisma.SelectionGetPayload<{ include: { character: true } }>;

  const rows: Row[] = await prisma.selection.findMany({
    where: { serverId, questId },
    include: { character: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return Response.json(
    rows.map((r) => ({
      id: r.id,
      when: r.createdAt,
      characterName: r.character.name,
      characterLevel: r.character.level,
      characterClass: r.character.class,
      avatar: getClassImage(String(r.character.class)),
      isMine: !!(
        me?.activeCharacterId && r.character.id === me.activeCharacterId
      ), // ou compare userId si tu préfères
    }))
  );
}
