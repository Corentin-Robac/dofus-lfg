// app/api/characters/route.ts
export const runtime = 'nodejs'

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

function normalizeName(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

const Body = z.object({
  serverId: z.coerce.number().int().min(1),
  name: z
    .string()
    .min(1)
    .max(40)
    .trim()
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\-\[\]]+$/u, "Nom invalide"),
  level: z.coerce.number().int().min(1).max(200),
  class: z.enum([
    "Feca",
    "Osamodas",
    "Enutrof",
    "Sram",
    "Xelor",
    "Ecaflip",
    "Eniripsa",
    "Iop",
    "Crâ",
    "Cra",
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
  ]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      characters: {
        include: { server: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json({
    activeCharacterId: user.activeCharacterId ?? null,
    characters: user.characters.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      class: c.class,
      serverId: c.serverId,
      serverName: c.server.name, // ✅ renvoyé au front
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return new Response("User not found", { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  const { serverId, name, level, class: cls } = parsed.data;
  const safeName = normalizeName(name);

  const duplicate = await prisma.character.findFirst({
    where: { userId: user.id, serverId, name: safeName },
    select: { id: true },
  });
  if (duplicate) {
    return new Response(
      "Un personnage avec ce nom existe déjà sur ce serveur.",
      { status: 409 }
    );
  }

  const clsValue = cls === "Cra" ? "Crâ" : cls;
  const created = await prisma.character.create({
    data: {
      userId: user.id,
      serverId,
      name: safeName,
      level,
      class: clsValue as Prisma.CharacterCreateInput["class"],
    },
  });

  if (!user.activeCharacterId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCharacterId: created.id },
    });
  }

  return Response.json({ ok: true, character: created }, { status: 201 });
}
