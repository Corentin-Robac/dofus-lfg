// app/api/db-health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs' // important: Prisma ne fonctionne pas en edge

const prisma = new PrismaClient({
  // utile avec le pooler supabase + vercel serverless
  // (si tu as déjà un "lib/prisma" singleton, importe-le plutôt)
})

export async function GET() {
  try {
    // requête la plus simple possible
    const serverCount = await prisma.server.count()
    const userCount = await prisma.user.count()
    return NextResponse.json({ ok: true, serverCount, userCount })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message ?? String(err) },
      { status: 500 }
    )
  } finally {
    // en serverless, on évite prisma.$disconnect() pour laisser le pooler faire son boulot
  }
}
