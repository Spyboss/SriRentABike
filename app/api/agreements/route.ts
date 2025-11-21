import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
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
  const body = await req.json()
  const created = await prisma.agreement.create({ data: body })
  return NextResponse.json(created)
}