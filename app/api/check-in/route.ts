import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const CustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationality: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(3),
  address: z.string().min(1),
  hotel: z.string().min(1),
  docType: z.string().min(1),
  docNumber: z.string().min(1)
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = CustomerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const c = await prisma.customer.create({ data: parsed.data })
  const a = await prisma.agreement.create({ data: { customerId: c.id, status: 'PENDING' } })
  return NextResponse.json({ agreementId: a.id })
}