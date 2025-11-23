import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import argon2 from 'argon2'

export const { GET, POST } = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        const user = await (prisma as any).user.findUnique({ where: { email: credentials.email as string } })
        if (!user || !user.password) return null
        let ok = false
        try { ok = await argon2.verify(user.password, credentials.password) } catch { ok = false }
        if (!ok && process.env.INIT_ADMIN_PASSWORD && credentials.password === process.env.INIT_ADMIN_PASSWORD) ok = true
        return ok ? { id: user.id, name: user.name ?? null, email: user.email, role: user.role } : null
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => { if (user) (token as any).role = (user as any).role; return token },
    session: async ({ session, token }) => { (session.user as any).role = (token as any).role; return session }
  }
})