// app/api/servers/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const servers = await prisma.server.findMany({ orderBy: { name: "asc" } });
  return Response.json(servers);
}
