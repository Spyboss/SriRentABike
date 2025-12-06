'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import * as Tabs from '@radix-ui/react-tabs'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationality: z.string().min(1),
  email: z.string().email(),
  phone: z
    .string()
    .min(3)
    .refine((val) => isValidPhoneNumber(val, 'LK'), { message: 'Invalid phone number' }),
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

type FormData = z.infer<typeof schema>

export default function CheckInForm() {
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [step, setStep] = useState<number>(0)
  const { register, handleSubmit, trigger, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) {
        // Handle error gracefully, e.g., show toast
        console.error('Check-in failed')
        return
    }
    const json = await res.json()
    setSubmittedId(json.agreementId)
  }

  if (submittedId) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded" aria-live="polite" role="status">
        <p className="text-green-800 font-medium">Success. Please go to counter.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6" noValidate>
      <Tabs.Root value={`step-${step}`} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Step {step + 1} of 3</div>
          <div className="flex gap-1">
            <span className={`h-2 w-2 rounded-full ${step >= 0 ? 'bg-primary' : 'bg-gray-300'}`} />
            <span className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
            <span className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
          </div>
        </div>

        <Tabs.Content value="step-0" className="animate-in fade-in-50 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={(r) => {
                  setRange(r)
                  if (r?.from) setValue('startDate', new Date(r.from).toISOString().slice(0,10))
                  if (r?.to) setValue('endDate', new Date(r.to).toISOString().slice(0,10))
                }}
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" aria-invalid={!!errors.startDate} aria-describedby={errors.startDate ? 'startDate-error' : undefined} {...register('startDate')} />
              {errors.startDate && <p className="text-red-600 text-sm" aria-live="polite" id="startDate-error">{(errors.startDate.message as string) ?? 'Required'}</p>}
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" aria-invalid={!!errors.endDate} aria-describedby={errors.endDate ? 'endDate-error' : undefined} {...register('endDate')} />
              {errors.endDate && <p className="text-red-600 text-sm" aria-live="polite" id="endDate-error">{errors.endDate.message as string}</p>}
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="step-1" className="animate-in fade-in-50 slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'firstName-error' : undefined} {...register('firstName')} />
              {errors.firstName && <p className="text-red-600 text-sm" aria-live="polite" id="firstName-error">Required</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'lastName-error' : undefined} {...register('lastName')} />
              {errors.lastName && <p className="text-red-600 text-sm" aria-live="polite" id="lastName-error">Required</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" aria-invalid={!!errors.nationality} aria-describedby={errors.nationality ? 'nationality-error' : undefined} {...register('nationality')} />
              {errors.nationality && <p className="text-red-600 text-sm" aria-live="polite" id="nationality-error">Required</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
              {errors.email && <p className="text-red-600 text-sm" aria-live="polite" id="email-error">Invalid email</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone/WhatsApp</Label>
            <Input id="phone" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} {...register('phone')} />
            {errors.phone && <p className="text-red-600 text-sm" aria-live="polite" id="phone-error">{errors.phone.message as string ?? 'Required'}</p>}
          </div>
        </Tabs.Content>

        <Tabs.Content value="step-2" className="animate-in fade-in-50 slide-in-from-bottom-2">
          <div>
            <Label htmlFor="address">Home Address</Label>
            <Input id="address" aria-invalid={!!errors.address} aria-describedby={errors.address ? 'address-error' : undefined} {...register('address')} />
            {errors.address && <p className="text-red-600 text-sm" aria-live="polite" id="address-error">Required</p>}
          </div>
          <div>
            <Label htmlFor="hotel">Hotel Name (Local Address)</Label>
            <Input id="hotel" aria-invalid={!!errors.hotel} aria-describedby={errors.hotel ? 'hotel-error' : undefined} {...register('hotel')} />
            {errors.hotel && <p className="text-red-600 text-sm" aria-live="polite" id="hotel-error">Required</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="docType">Document Type</Label>
              <Select id="docType" aria-invalid={!!errors.docType} aria-describedby={errors.docType ? 'docType-error' : undefined} {...register('docType')}>
                <option value="Passport">Passport</option>
                <option value="License">License</option>
              </Select>
              {errors.docType && <p className="text-red-600 text-sm" aria-live="polite" id="docType-error">Required</p>}
            </div>
            <div>
              <Label htmlFor="docNumber">Document No</Label>
              <Input id="docNumber" aria-invalid={!!errors.docNumber} aria-describedby={errors.docNumber ? 'docNumber-error' : undefined} {...register('docNumber')} />
              {errors.docNumber && <p className="text-red-600 text-sm" aria-live="polite" id="docNumber-error">Required</p>}
            </div>
          </div>
        </Tabs.Content>

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
          ) : <span />}
          {step < 2 ? (
            <Button
              type="button"
              onClick={async () => {
                const ok = step === 0
                  ? await trigger(['startDate', 'endDate'])
                  : await trigger(['firstName', 'lastName', 'nationality', 'email', 'phone'])
                if (ok) setStep((s) => Math.min(2, s + 1))
              }}
            >
              Next
            </Button>
          ) : (
            <Button disabled={isSubmitting} aria-busy={isSubmitting} className="transition-colors focus-visible:ring-2 focus-visible:ring-blue-600">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting
                </span>
              ) : (
                'Submit'
              )}
            </Button>
          )}
        </div>
      </Tabs.Root>
    </form>
  )
}
