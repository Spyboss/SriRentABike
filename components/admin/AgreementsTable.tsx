"use client"
import { useMemo, useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, SortingState } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Agreement = {
  id: string
  createdAt: string
  status: string
  customer: { firstName: string; lastName: string; nationality: string }
}

export default function AgreementsTable({ data }: { data: Agreement[] }) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])

  const columns = useMemo(
    () => [
      {
        id: 'customer',
        header: 'Customer',
        accessorFn: (row: Agreement) => `${row.customer.firstName} ${row.customer.lastName}`,
        cell: (info: any) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        id: 'nationality',
        header: 'Nationality',
        accessorFn: (row: Agreement) => row.customer.nationality,
        cell: (info: any) => info.getValue(),
      },
      {
        id: 'createdAt',
        header: 'Created',
        accessorFn: (row: Agreement) => new Date(row.createdAt),
        cell: (info: any) => new Date(info.getValue()).toLocaleString(),
        sortingFn: (a: any, b: any, columnId: string) => {
          const av = a.getValue<Date>(columnId).getTime()
          const bv = b.getValue<Date>(columnId).getTime()
          return av === bv ? 0 : av > bv ? 1 : -1
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row: Agreement) => row.status,
        cell: (info: any) => (
          <span className={`inline-block rounded px-2 py-1 text-xs ${info.getValue() === 'PENDING' ? 'bg-yellow-100 text-yellow-900' : 'bg-green-100 text-green-900'}`}>{info.getValue()}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info: any) => {
          const row = info.row.original as Agreement
          return (
            <div className="inline-flex items-center gap-2 justify-end w-full">
              <Link href={`/admin/agreement/${row.id}`}><Button>Edit</Button></Link>
              <Link href={`/admin/preview/${row.id}`}><Button variant="secondary">PDF</Button></Link>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    globalFilterFn: (row, columnId, filterValue) => {
      const v = row.getValue<string>(columnId)
      return String(v).toLowerCase().includes(String(filterValue).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search customer…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="overflow-x-auto rounded border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} className={header.column.id === 'actions' ? 'text-right' : ''}>
                    {header.isPlaceholder ? null : (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Sort by ${header.column.columnDef.header}`}
                      >
                        {flexRender(header.column.columnDef.header as any, header.getContext())}
                        {{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? ''}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'text-right' : ''}>
                    {flexRender(cell.column.columnDef.cell as any, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

