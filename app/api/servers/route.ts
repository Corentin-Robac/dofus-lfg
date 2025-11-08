// app/api/servers/route.ts
export const runtime = 'nodejs'

import { prisma } from "@/lib/prisma";

export async function GET() {
  const servers = await prisma.server.findMany({ orderBy: { name: "asc" } });
  return Response.json(servers);
}
