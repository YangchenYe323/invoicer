import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.BETTER_AUTH_URL || 'http://localhost:3000',
})

export async function getSession() {
  const session = await authClient.getSession()
  return session
}
