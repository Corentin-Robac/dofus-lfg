// app/api/characters/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function normalizeName(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

// helper: dans Next 16, params peut être un Promise
async function unwrapParams<T>(maybe: T | Promise<T>): Promise<T> {
  return typeof (maybe as any)?.then === "function"
    ? await (maybe as Promise<T>)
    : (maybe as T);
}

const PatchBody = z.object({
  serverId: z.coerce.number().int().min(1).optional(),
  name: z
    .string()
    .min(1)
    .max(40)
    .trim()
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+$/u, "Nom invalide")
    .optional(),
  level: z.coerce.number().int().min(1).max(200).optional(),
  class: z
    .enum([
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
    ])
    .optional(),
});

// PATCH /api/characters/[id] — modifier un perso
export async function PATCH(
  req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const { id } = await unwrapParams((ctx as any).params);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  // propriété
  const char = await prisma.character.findUnique({ where: { id } });
  if (!char || char.userId !== user.id)
    return new Response("Not found", { status: 404 });

  // éviter doublon (même userId + serverId + name)
  const nextServerId = parsed.data.serverId ?? char.serverId;
  const nextName = parsed.data.name ? normalizeName(parsed.data.name) : char.name;
  const duplicate = await prisma.character.findFirst({
    where: {
      userId: user.id,
      serverId: nextServerId,
      name: nextName,
      NOT: { id: char.id },
    },
    select: { id: true },
  });
  if (duplicate) {
    return new Response(
      "Un personnage avec ce nom existe déjà sur ce serveur.",
      { status: 409 }
    );
  }

  const updated = await prisma.character.update({
    where: { id },
    data: {
      serverId: parsed.data.serverId ?? undefined,
      name: parsed.data.name ? normalizeName(parsed.data.name) : undefined,
      level: parsed.data.level ?? undefined,
      class: (parsed.data.class as any) ?? undefined,
    },
    include: { server: true },
  });

  return Response.json({
    ok: true,
    character: {
      id: updated.id,
      name: updated.name,
      level: updated.level,
      class: updated.class,
      serverId: updated.serverId,
      serverName: updated.server.name,
    },
  });
}

// DELETE /api/characters/[id] — supprimer un perso + ses sélections
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const { id } = await unwrapParams((ctx as any).params);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, activeCharacterId: true },
  });
  if (!user) return new Response("User not found", { status: 404 });

  const char = await prisma.character.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!char || char.userId !== user.id)
    return new Response("Not found", { status: 404 });

  // supprime d'abord les sélections liées
  await prisma.selection.deleteMany({ where: { characterId: id } });

  // si c'était l'actif, on le retire
  if (user.activeCharacterId === id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCharacterId: null },
    });
  }

  await prisma.character.delete({ where: { id } });
  return Response.json({ ok: true });
}
