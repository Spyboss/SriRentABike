'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'

const schema = z.object({
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

type FormData = z.infer<typeof schema>

export default function CheckInForm() {
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const json = await res.json()
    if (res.ok) setSubmittedId(json.agreementId)
  }

  if (submittedId) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded">
        <p className="text-green-800 font-medium">Success. Please go to counter.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">First Name</label>
          <input className="w-full border rounded px-3 py-2" {...register('firstName')} />
          {errors.firstName && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <label className="block text-sm">Last Name</label>
          <input className="w-full border rounded px-3 py-2" {...register('lastName')} />
          {errors.lastName && <p className="text-red-600 text-sm">Required</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Nationality</label>
          <input className="w-full border rounded px-3 py-2" {...register('nationality')} />
          {errors.nationality && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <label className="block text-sm">Document Type</label>
          <select className="w-full border rounded px-3 py-2" {...register('docType')}>
            <option value="Passport">Passport</option>
            <option value="License">License</option>
          </select>
          {errors.docType && <p className="text-red-600 text-sm">Required</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm">Document No</label>
        <input className="w-full border rounded px-3 py-2" {...register('docNumber')} />
        {errors.docNumber && <p className="text-red-600 text-sm">Required</p>}
      </div>
      <div>
        <label className="block text-sm">Home Address</label>
        <input className="w-full border rounded px-3 py-2" {...register('address')} />
        {errors.address && <p className="text-red-600 text-sm">Required</p>}
      </div>
      <div>
        <label className="block text-sm">Hotel Name (Local Address)</label>
        <input className="w-full border rounded px-3 py-2" {...register('hotel')} />
        {errors.hotel && <p className="text-red-600 text-sm">Required</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Phone/WhatsApp</label>
          <input className="w-full border rounded px-3 py-2" {...register('phone')} />
          {errors.phone && <p className="text-red-600 text-sm">Required</p>}
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" {...register('email')} />
          {errors.email && <p className="text-red-600 text-sm">Invalid email</p>}
        </div>
      </div>
      <button disabled={isSubmitting} className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
    </form>
  )
}