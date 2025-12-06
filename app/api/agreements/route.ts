import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const agreements = await prisma.agreement.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, bike: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(agreements)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const created = await prisma.agreement.create({ data: body })
  return NextResponse.json(created)
}
