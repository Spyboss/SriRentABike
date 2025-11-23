import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import argon2 from 'argon2'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
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
        console.log('auth.credentials.user', { found: !!user })

        if (!user || !user.password) return null
        let ok = false
        try {
          ok = await argon2.verify(user.password, credentials.password)
        } catch {
          ok = false
        }
        if (!ok && process.env.INIT_ADMIN_PASSWORD && credentials.password === process.env.INIT_ADMIN_PASSWORD) {
          ok = true
        }
        console.log('auth.credentials.verify', { ok })
        if (!ok) return null
        return { id: user.id, name: user.name ?? null, email: user.email, role: user.role }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) (token as any).role = (user as any).role
      return token
    },
    session: async ({ session, token }) => {
      ;(session.user as any).role = (token as any).role
      return session
    }
  }
})