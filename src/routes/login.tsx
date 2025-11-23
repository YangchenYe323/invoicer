import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Receipt, Mail, Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { getSessionFn } from '@/lib/auth-server'

export const Route = createFileRoute('/login')({
  beforeLoad: async (_ctx) => {
    const session = await getSessionFn()
    if (session?.user) {
      throw redirect({ to: '/dashboard/', replace: true })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isLogin) {
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        })
        if (result.error) {
          throw new Error(result.error.message)
        }
        router.navigate({ to: '/dashboard' })
      } else {
        const result = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        })
        if (result.error) {
          throw new Error(result.error.message)
        }
        router.navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-300 mb-8 transition-all duration-300">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg blur-lg opacity-50" />
              <Receipt className="w-12 h-12 text-cyan-400 relative" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Invoicer
            </h1>
          </div>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md border-cyan-900/30 shadow-xl shadow-cyan-900/10">
          <CardHeader>
            <CardTitle className="text-cyan-100">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Enter your details to create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-cyan-200">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                    className="bg-slate-900/50 border-cyan-900/50 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-700/50 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-200 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-900/50 border-cyan-900/50 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-700/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-cyan-200 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-slate-900/50 border-cyan-900/50 text-cyan-100 placeholder:text-slate-500 focus:border-cyan-700/50 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-900/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                }}
                className="text-sm text-slate-400 hover:text-cyan-300 transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="text-cyan-400 hover:text-cyan-300 font-medium">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
