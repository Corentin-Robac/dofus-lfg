// app/api/matches/route.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getClassImage } from "@/lib/classImages";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
  const serverId = Number(searchParams.get("serverId"));
  const questId = Number(searchParams.get("questId"));
  if (!serverId || !questId)
    return new Response("Missing params", { status: 400 });

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
