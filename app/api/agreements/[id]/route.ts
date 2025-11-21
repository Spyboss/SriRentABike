import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Params = { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  const a = await prisma.agreement.findUnique({ where: { id: params.id }, include: { customer: true, bike: true } })
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(a)
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json()
  const updated = await prisma.agreement.update({ where: { id: params.id }, data: body })
  return NextResponse.json(updated)
}