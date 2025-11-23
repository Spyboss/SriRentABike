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
  docNumber: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1)
}).superRefine((data, ctx) => {
  const s = new Date(data.startDate)
  const e = new Date(data.endDate)
  const ns = new Date(s)
  const ne = new Date(e)
  ns.setHours(0, 0, 0, 0)
  ne.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (isNaN(s.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Invalid start date' })
  }
  if (isNaN(e.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Invalid end date' })
  }
  if (ns < today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'Start date cannot be in the past' })
  }
  const minEnd = new Date(ns.getTime() + 24 * 60 * 60 * 1000)
  if (ne < minEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Must be at least 1 day after start' })
  }
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = CustomerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { startDate, endDate, ...customer } = parsed.data
  const c = await prisma.customer.create({ data: customer })
  const a = await prisma.agreement.create({ data: { customerId: c.id, status: 'PENDING', startTime: new Date(startDate), endTime: new Date(endDate) } })
  return NextResponse.json({ agreementId: a.id })
}