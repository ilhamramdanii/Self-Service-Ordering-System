import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — NO bcrypt, NO prisma, NO Node.js-only modules
// Used only by middleware to check session validity
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { role: string; restaurantId: string; restaurantName: string }
        token.role = u.role
        token.restaurantId = u.restaurantId
        token.restaurantName = u.restaurantName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, string>
        u.id = token.sub!
        u.role = token.role as string
        u.restaurantId = token.restaurantId as string
        u.restaurantName = token.restaurantName as string
      }
      return session
    },
  },
  providers: [], // providers are added in lib/auth.ts (Node.js runtime only)
}
