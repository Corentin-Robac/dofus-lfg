// app/api/selection/route.ts
export const runtime = 'nodejs'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";

function sanitizeNote(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 500);
}

const Body = z.object({
  serverId: z.coerce.number().int().min(1),
  questId: z.coerce.number().int().min(1),
  note: z.string().max(500).optional(),
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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });
  const { serverId, questId, note } = parsed.data;
  const safeNote = note ? sanitizeNote(note) : undefined;

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
      data: { note: safeNote }
    });
  } else {
    await prisma.selection.create({
      data: {
        characterId: user.activeCharacter.id,
        serverId,
        questId,
        note: safeNote,
      },
    });
  }

  return Response.json({ ok: true });
}
