import Link from 'next/link'
import { prisma } from '@/lib/db'
import AgreementsTable from '@/components/admin/AgreementsTable'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()
  if (!session) {
    redirect('/login?redirect=/admin')
  }
  try {
    const agreements = await prisma.agreement.findMany({ where: { status: 'PENDING' }, include: { customer: true }, orderBy: { createdAt: 'desc' } })
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pending Agreements</h2>
          <div className="text-sm text-gray-600">Total: {agreements.length}</div>
        </div>
        <AgreementsTable data={agreements as any} />
      </div>
    )
  } catch (err) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pending Agreements</h2>
        </div>
        <div className="rounded border bg-yellow-50 p-3 text-yellow-900">
          Unable to connect to database. Please verify Supabase credentials and network access.
        </div>
      </div>
    )
  }
}
