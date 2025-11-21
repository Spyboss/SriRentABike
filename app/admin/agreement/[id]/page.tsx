import { prisma } from '@/lib/db'
import AgreementEditor from '@/components/forms/AgreementEditor'

export default async function AgreementDetailPage({ params }: { params: { id: string } }) {
  const agreement = await prisma.agreement.findUnique({ where: { id: params.id }, include: { customer: true, bike: true } })
  const bikes = await prisma.bike.findMany({ orderBy: { make: 'asc' } })
  if (!agreement) return <div className="text-red-600">Not found</div>
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agreement</h2>
      <div className="p-3 border rounded">
        <div className="font-medium">{agreement.customer.firstName} {agreement.customer.lastName}</div>
        <div className="text-sm text-gray-600">{agreement.customer.nationality}</div>
      </div>
      <AgreementEditor agreement={agreement} bikes={bikes} />
    </div>
  )
}