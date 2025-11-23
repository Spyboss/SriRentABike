'use server'

import { signIn } from '@/auth'
// client login now handles errors; server action kept for reference
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  redirectTo: z.string().optional()
})

export async function login(prevState: any, formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Invalid input' }
  const { email, password, redirectTo } = parsed.data
  try {
    await signIn('credentials', { email, password, redirectTo: redirectTo ?? '/admin' })
    return { success: true }
  } catch (e) {
    return { error: 'Authentication error' }
  }
}