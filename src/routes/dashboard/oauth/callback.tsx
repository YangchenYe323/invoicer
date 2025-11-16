import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { auth } from '@/lib/auth'
import { db } from '@/db/db'
import { source } from '@/db/schema'

// Server function to handle OAuth callback
const handleOAuthCallbackFn = createServerFn({ method: 'GET' }).handler(
  async (ctx: { code?: string; error?: string; headers: Headers }) => {
    const session = await auth.api.getSession({ headers: ctx.headers })

    if (!session) {
      throw redirect({ to: '/login' })
    }

    if (ctx.error) {
      return { success: false, error: ctx.error }
    }

    if (!ctx.code) {
      return { success: false, error: 'No authorization code received' }
    }

    try {
      // Exchange authorization code for tokens
      const clientId = process.env.GOOGLE_OAUTH2_CLIENT_ID
      const clientSecret = process.env.GOOGLE_OAUTH2_CLIENT_SECRET
      const redirectUri = `${process.env.BETTER_AUTH_URL}/dashboard/oauth/callback`

      const tokenResponse = await fetch('https://accounts.google.com/o/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          code: ctx.code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error(tokens.error_description || 'Failed to exchange authorization code')
      }

      // Get user's email from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })

      const userInfo = await userInfoResponse.json()

      // Calculate token expiration
      const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      // Store source in database
      await db.insert(source).values({
        name: `${session.user.name}/gmail/${userInfo.email}`,
        userId: session.user.id,
        emailAddress: userInfo.email,
        sourceType: 'gmail',
        oauth2AccessToken: tokens.access_token,
        oauth2RefreshToken: tokens.refresh_token,
        oauth2AccessTokenExpiresAt: accessTokenExpiresAt,
        oauth2RefreshTokenExpiresAt: null, // Google refresh tokens don't expire unless revoked
      })

      return { success: true }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete OAuth flow',
      }
    }
  }
)

export const Route = createFileRoute('/dashboard/oauth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string | undefined,
    error: search.error as string | undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    return await handleOAuthCallbackFn({
      ...deps,
      headers: context.request.headers,
    })
  },
  component: OAuthCallback,
})

function OAuthCallback() {
  const result = Route.useLoaderData()

  if (result.success) {
    // Redirect to dashboard
    window.location.href = '/dashboard'
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Gmail account connected successfully!</p>
          <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 mb-4">
          <h2 className="text-red-400 text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-300">{result.error}</p>
        </div>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
