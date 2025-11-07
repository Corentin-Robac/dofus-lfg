// app/api/quests/search/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

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
