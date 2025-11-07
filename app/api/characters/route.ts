// app/api/characters/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const Body = z.object({
  serverId: z.coerce.number().int().min(1),
  name: z.string().min(2).max(30).trim(),
  level: z.coerce.number().int().min(1).max(300),
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

  const duplicate = await prisma.character.findFirst({
    where: { userId: user.id, serverId, name },
    select: { id: true },
  });
  if (duplicate) {
    return new Response(
      "Un personnage avec ce nom existe déjà sur ce serveur.",
      { status: 409 }
    );
  }

  const created = await prisma.character.create({
    data: {
      userId: user.id,
      serverId,
      name,
      level,
      class: cls as Prisma.DofusClass,
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
