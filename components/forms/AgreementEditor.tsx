'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useMemo, useState } from 'react'
import { diffDays } from '@/lib/utils/dates'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const schema = z.object({
  bikeId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  ratePerDay: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0),
  fuelLevel: z.string().min(1)
})

type FormData = z.infer<typeof schema>

export default function AgreementEditor({ agreement, bikes }: { agreement: any, bikes: any[] }) {
  const [bikeFilter, setBikeFilter] = useState('')
  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      bikeId: agreement.bikeId ?? '',
      startTime: agreement.startTime ? new Date(agreement.startTime).toISOString().slice(0, 10) : '',
      endTime: agreement.endTime ? new Date(agreement.endTime).toISOString().slice(0, 10) : '',
      ratePerDay: agreement.ratePerDay ?? 0,
      deposit: agreement.deposit ?? 0,
      fuelLevel: agreement.fuelLevel ?? ''
    }
  })

  const start = watch('startTime')
  const end = watch('endTime')
  const rate = watch('ratePerDay')

  const totals = useMemo(() => {
    if (!start || !end || !rate) return { days: 0, total: 0 }
    const days = diffDays(new Date(start), new Date(end))
    return { days, total: days * Number(rate) }
  }, [start, end, rate])

  useEffect(() => {
    setValue('ratePerDay', Number(rate))
  }, [rate, setValue])

  async function onSubmit(data: FormData) {
    const payload = {
      bikeId: data.bikeId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      ratePerDay: Number(data.ratePerDay),
      deposit: Number(data.deposit),
      totalDays: totals.days,
      totalAmount: totals.total,
      fuelLevel: data.fuelLevel,
      status: 'ACTIVE'
    }
    await fetch(`/api/agreements/${agreement.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Bike</Label>
        <Input
          placeholder="Search by make, model, or plate"
          value={bikeFilter}
          onChange={(e) => setBikeFilter(e.target.value)}
          className="mb-2"
        />
        <Select {...register('bikeId')}>
          <option value="">Select bike</option>
          {bikes
            .filter(b => `${b.make} ${b.model} ${b.plateNo}`.toLowerCase().includes(bikeFilter.toLowerCase()))
            .map(b => (
              <option key={b.id} value={b.id}>{b.make} {b.model} ({b.plateNo})</option>
            ))}
        </Select>
        {errors.bikeId && <p className="text-red-600 text-sm">Required</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input type="date" {...register('startTime')} />
          {errors.startTime && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" {...register('endTime')} />
          {errors.endTime && <p className="text-red-600 text-sm">Required</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Rate per Day</Label>
          <Input type="number" step="0.01" {...register('ratePerDay')} />
          {errors.ratePerDay && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <Label>Deposit</Label>
          <Input type="number" step="0.01" {...register('deposit')} />
          {errors.deposit && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <Label>Fuel Level</Label>
          <div className="flex flex-wrap gap-2">
            {['E','1/4','1/2','3/4','F'].map(val => (
              <label key={val} className="inline-flex items-center gap-2 rounded border px-3 py-2 cursor-pointer">
                <input type="radio" value={val} {...register('fuelLevel')} className="accent-primary" />
                <span>{val}</span>
              </label>
            ))}
          </div>
          {errors.fuelLevel && <p className="text-red-600 text-sm">Required</p>}
        </div>
      </div>
      <Card>
        <CardContent>
          <div className="text-sm">Total Days: {totals.days}</div>
          <div className="text-sm">Total Amount: {totals.total}</div>
        </CardContent>
      </Card>
      <Button disabled={isSubmitting}>Save</Button>
    </form>
  )
}
