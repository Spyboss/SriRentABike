import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
  const agreements = await prisma.agreement.findMany({ where: { status: 'PENDING' }, include: { customer: true }, orderBy: { createdAt: 'desc' } })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pending Agreements</h2>
        <div className="text-sm text-gray-600">Total: {agreements.length}</div>
      </div>
      <div className="overflow-x-auto rounded border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreements.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.customer.firstName} {a.customer.lastName}</TableCell>
                <TableCell>{a.customer.nationality}</TableCell>
                <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link href={`/admin/agreement/${a.id}`}>
                      <Button>Edit</Button>
                    </Link>
                    <Link href={`/admin/preview/${a.id}`}>
                      <Button variant="secondary">PDF</Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}