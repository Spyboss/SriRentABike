import { prisma } from '@/lib/db'
import AgreementPreviewClient from '@/components/pdf/AgreementPreviewClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

function formatDate(dt?: Date | null) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toISOString().slice(0, 10)
}

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    redirect(`/login?redirect=/admin/preview/${params.id}`)
  }
  const a = await prisma.agreement.findUnique({ where: { id: params.id }, include: { customer: true, bike: true } })
  if (!a) return <div className="text-red-600">Not found</div>
  const data = {
    customer: a.customer,
    bike: a.bike,
    agreement: { fuelLevel: a.fuelLevel },
    rental: {
      startDate: formatDate(a.startTime),
      endDate: formatDate(a.endTime),
      total: a.totalAmount
    }
  }
  return <AgreementPreviewClient data={data} />
}
