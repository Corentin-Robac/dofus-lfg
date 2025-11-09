// app/api/db-health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs' // important: Prisma ne fonctionne pas en edge

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
