'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [error, setError] = useState<string | null>(null)
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')
    setError(null)
    const res = await signIn('credentials', { email, password, callbackUrl: redirectTo ?? '/admin', redirect: true })
    if (res?.error) setError('Invalid email or password')
  }
  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader>
        <h2 className="text-xl font-semibold">Admin Login</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit">Sign In</Button>
        </form>
      </CardContent>
    </Card>
  )
}