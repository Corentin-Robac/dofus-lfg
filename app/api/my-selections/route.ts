// app/api/my-selections/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, activeCharacterId: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  if (!user.activeCharacterId) {
    // Aucun perso actif → on renvoie une liste vide (plus simple côté UI)
    return Response.json([]);
  }

  const rows = await prisma.selection.findMany({
    where: { characterId: user.activeCharacterId },
    include: {
      quest: true,
      server: true,
      character: {
        select: {
          id: true,
          name: true,
          level: true,
          class: true,
          serverId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return Response.json(
    rows.map((r) => ({
      id: r.id,
      when: r.createdAt,
      questId: r.questId,
      questName: r.quest.name,
      serverId: r.serverId,
      serverName: r.server.name,
      characterId: r.character.id,
      characterName: r.character.name,
      characterLevel: r.character.level,
      characterClass: r.character.class,
    }))
  );
}
