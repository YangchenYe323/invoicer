import { db } from '@/db/db'
import { source } from '@/db/schema'
import { getSessionFn } from '@/lib/auth-server'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import * as jose from "jose"

// https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo
interface ExchangeCodeForTokensResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  refresh_token_expires_in?: number
  id_token: string
  token_type: string
}

interface IDTokenPayload {
  iss: string
  azp: string
  aud: string
  sub: string
  email: string
  email_verified: boolean
  at_hash: string
  iat: number
  exp: number
}

export const Route = createFileRoute('/dashboard/gmail/callback')({
  component: RouteComponent,
})

const createGmailSourceFn = createServerFn({ method: 'POST' })
  .inputValidator((code: string) => z.string().parse(code))
  .handler(
    async (ctx) => {
      const code = ctx.data

      const session = await getSessionFn()
      if (!session?.user) {
        throw new Error('Unauthorized')
      }

      // Exchange code for access/refresh tokens
      const params = new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_OAUTH2_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH2_REDIRECT_URI!,
        grant_type: 'authorization_code',
      })

      const exchangeCodeForTokensRes = await fetch(`https://oauth2.googleapis.com/token?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!exchangeCodeForTokensRes.ok) {
        console.error(`Failed to exchange code for tokens: ${exchangeCodeForTokensRes.status} ${await exchangeCodeForTokensRes.text()}`)
        throw new Error('Failed to exchange code for tokens')
      }

      const data: ExchangeCodeForTokensResponse = await exchangeCodeForTokensRes.json()

      // Access user ID by decoding the ID token
      const payload: IDTokenPayload = jose.decodeJwt(data.id_token)

      const newSourceName = `${session.user.name}/gmail/${payload.email}`
      const refreshTokenExpiresAt: string | null = data.refresh_token_expires_in ? new Date(Date.now() + data.refresh_token_expires_in * 1000).toISOString() : null
      const newSource = await db.insert(source).values({
        userId: session.user.id,
        name: newSourceName,
        emailAddress: payload.email,
        sourceType: 'gmail',
        oauth2AccessToken: data.access_token,
        oauth2RefreshToken: data.refresh_token,
        oauth2AccessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        oauth2RefreshTokenExpiresAt: refreshTokenExpiresAt,
      }).returning({ id: source.id })

      console.log(`Created GMail source ${newSource[0].id} for user ${session.user.id}: ${newSourceName}`)

      return {}
    },
  )

function RouteComponent() {
  const router = useRouter()
  const search = useSearch({ from: "/dashboard/gmail/callback" })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const createSource = async () => {
      try {
        await createGmailSourceFn({ data: search.code })
        router.navigate({ to: '/dashboard/' })
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred while creating the GMail source')
      } finally {
        setIsLoading(false)
      }
    };
    createSource()
  }, [search.code, router])

  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}
      {isLoading && <div className="text-gray-500">Creating GMail source...</div>}
      {!isLoading && !error && <div className="text-green-500">GMail source created successfully, redirecting to dashboard...</div>}
    </div>
  )
}
