// app/api/selection/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";

const Body = z.object({
  serverId: z.number(),
  questId: z.number(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { activeCharacter: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  if (!user.activeCharacter) {
    return new Response("Aucun personnage actif sélectionné.", { status: 400 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Invalid body", { status: 400 });
  const { serverId, questId, note } = parsed.data;

  // sécurité : le perso actif doit être sur le même serveur choisi
  if (user.activeCharacter.serverId !== serverId) {
    return new Response(
      "Le serveur sélectionné ne correspond pas à votre personnage actif.",
      { status: 400 }
    );
  }

  const existing = await prisma.selection.findFirst({
    where: { characterId: user.activeCharacter.id, serverId, questId },
  });

  if (existing) {
    await prisma.selection.update({
      where: { id: existing.id },
      data: { note },
    });
  } else {
    await prisma.selection.create({
      data: {
        characterId: user.activeCharacter.id,
        serverId,
        questId,
        note,
      },
    });
  }

  return Response.json({ ok: true });
}
