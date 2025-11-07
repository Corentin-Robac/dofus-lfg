// app/api/characters/active/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({ characterId: z.string().nullable() });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return new Response("User not found", { status: 404 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  const { characterId } = parsed.data;

  if (characterId) {
    const owned = await prisma.character.findFirst({
      where: { id: characterId, userId: user.id },
      select: { id: true },
    });
    if (!owned) return new Response("Forbidden", { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activeCharacterId: characterId ?? null },
  });

  return Response.json({ ok: true });
}
