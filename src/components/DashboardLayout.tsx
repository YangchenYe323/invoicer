import { useState, useEffect } from 'react'
import { Receipt, LogOut, Mail, Plus, FileText, DollarSign, Calendar, Check, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/db'
import { source, invoice } from '@/db/schema'
import { eq, desc, and, lt, or } from 'drizzle-orm'
import { getSessionFn } from '@/lib/auth-server'
import { z } from 'zod'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'

const generateGoogleOAuthURL = createServerFn({ method: 'GET' }).handler(
  async () => {
    const url = new URL('https://accounts.google.com/o/oauth2/auth')
    url.searchParams.set('client_id', process.env.GOOGLE_OAUTH2_CLIENT_ID!)
    url.searchParams.set('redirect_uri', process.env.GOOGLE_OAUTH2_REDIRECT_URI!)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'openid email https://mail.google.com/')
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    return url.toString()
  },
)

const getUserSources = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSessionFn()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const sources = await db
      .select({
        id: source.id,
        name: source.name,
        emailAddress: source.emailAddress,
        sourceType: source.sourceType,
        createdAt: source.createdAt,
      })
      .from(source)
      .where(eq(source.userId, session.user.id))

    return sources
  },
)

const deleteSource = createServerFn({ method: 'POST' })
  .inputValidator((sourceId: number) => z.number().parse(sourceId))
  .handler(
  async (ctx) => {
    const sourceId = ctx.data
    const session = await getSessionFn()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    await db
      .delete(source)
      .where(eq(source.id, sourceId))

    return { success: true }
  },
)

const getUserInvoices = createServerFn({ method: 'GET' })
  .inputValidator((input: { cursor?: { id: number; createdAt: Date } | null; limit?: number }) => {
    return z.object({
      cursor: z.object({ id: z.number(), createdAt: z.date() }).nullable().optional(),
      limit: z.number().optional(),
    }).parse(input)
  })
  .handler(async (ctx) => {
    const { cursor, limit = 10 } = ctx.data
    const session = await getSessionFn()
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    // Build the where clause for keyset pagination
    const whereConditions = [eq(invoice.userId, session.user.id)]

    if (cursor) {
      // For keyset pagination: WHERE (createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND id < cursor.id)
      // This ensures we get the next page of results after the cursor
      whereConditions.push(
        or(
          lt(invoice.createdAt, cursor.createdAt),
          and(
            eq(invoice.createdAt, cursor.createdAt),
            lt(invoice.id, cursor.id)
          )
        )!
      )
    }

    const invoices = await db
      .select({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        vendorName: invoice.vendorName,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        paymentStatus: invoice.paymentStatus,
        lineItems: invoice.lineItems,
        createdAt: invoice.createdAt,
      })
      .from(invoice)
      .where(and(...whereConditions))
      .orderBy(desc(invoice.createdAt), desc(invoice.id))
      .limit(limit + 1) // Fetch one extra to determine if there are more pages

    const hasNextPage = invoices.length > limit
    const items = hasNextPage ? invoices.slice(0, limit) : invoices
    const nextCursor = hasNextPage && items.length > 0
      ? { id: items[items.length - 1].id, createdAt: items[items.length - 1].createdAt }
      : null

    return {
      items,
      nextCursor,
    }
  })

interface DashboardLayoutProps {
  session: any
}

type InvoiceData = {
  id: number
  invoiceNumber: string | null
  vendorName: string | null
  totalAmount: string | null
  currency: string | null
  dueDate: Date | null
  paymentStatus: string | null
  lineItems: Array<{ description: string; quantity?: number; unitPrice?: number }> | null
  createdAt: Date
}

export default function DashboardLayout({ session }: DashboardLayoutProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isAddingSource, setIsAddingSource] = useState(false)

  // Fetch sources with React Query
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['sources'],
    queryFn: () => getUserSources(),
  })

  // Fetch invoices with infinite query and keyset pagination
  const {
    data: invoicesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInvoices,
  } = useInfiniteQuery({
    queryKey: ['invoices'],
    queryFn: ({ pageParam }) => getUserInvoices({ data: { cursor: pageParam, limit: 10 } }),
    initialPageParam: null as { id: number; createdAt: Date } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  // Flatten all pages into a single array
  const invoices = invoicesData?.pages.flatMap((page) => page.items) ?? []

  const handleLogout = async () => {
    await authClient.signOut()
    router.navigate({ to: '/' })
  }

  const handleAddGmailSource = async () => {
    setIsAddingSource(true)
    const url = await generateGoogleOAuthURL()
    window.location.href = url
  }

  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this source?')) {
      return
    }
    try {
      await deleteSource({ data: sourceId })
      // Invalidate both sources and invoices queries
      queryClient.invalidateQueries({ queryKey: ['sources'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    } catch (error) {
      console.error('Failed to delete source:', error)
      alert('Failed to delete source')
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-slate-500/20 text-slate-400 border-slate-500/30'

    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'unpaid':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const formatCurrency = (amount: string | null, currency: string | null) => {
    if (!amount) return 'N/A'
    const currencySymbol = currency || 'USD'
    try {
      const numAmount = Number.parseFloat(amount)
      return `${currencySymbol} $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } catch {
      return `${currencySymbol} ${amount}`
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const stats = {
    total: invoices.length,
    unpaid: invoices.filter((i) => i.paymentStatus?.toLowerCase() === 'unpaid').length,
    totalAmount: invoices.reduce((sum, i) => {
      if (!i.totalAmount) return sum
      try {
        return sum + Number.parseFloat(i.totalAmount)
      } catch {
        return sum
      }
    }, 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-mint-400 rounded-lg blur-sm opacity-50" />
              <Receipt className="w-8 h-8 text-cyan-400 relative" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-mint-400 bg-clip-text text-transparent">
              Invoicer
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">
              Welcome, <span className="text-cyan-300 font-medium">{session.user.name}</span>
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-cyan-900/50 text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-700/50 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 hover:border-cyan-700/50 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 relative">
              <CardDescription className="text-slate-400 text-sm">Total Invoices</CardDescription>
              <CardTitle className="text-4xl font-bold text-cyan-300">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 hover:border-emerald-700/50 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 relative">
              <CardDescription className="text-slate-400 text-sm">Unpaid Invoices</CardDescription>
              <CardTitle className="text-4xl font-bold text-emerald-300">{stats.unpaid}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 hover:border-teal-700/50 transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="pb-3 relative">
              <CardDescription className="text-slate-400 text-sm">Total Amount</CardDescription>
              <CardTitle className="text-4xl font-bold text-teal-300">
                ${stats.totalAmount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-teal-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Sources Section */}
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 mb-8 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-cyan-100 flex items-center gap-2">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              Email Sources
            </CardTitle>
            <CardDescription className="text-slate-400">
              Connect your email accounts to automatically import invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isLoadingSources && (
              <div className="text-center py-4 text-slate-400">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                <p className="mt-2">Loading sources...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSources && sources.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <div className="p-4 bg-cyan-500/5 rounded-full w-fit mx-auto mb-3">
                  <Mail className="w-12 h-12 text-cyan-500/50" />
                </div>
                <p className="mb-4">No email sources connected yet</p>
              </div>
            )}

            {/* Existing Sources */}
            {!isLoadingSources && sources.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-cyan-300">Connected Accounts</p>
                {sources.map((src) => (
                  <div
                    key={src.id}
                    className="group bg-slate-900/50 border border-cyan-900/30 rounded-lg p-4 flex items-center justify-between hover:border-cyan-700/50 hover:bg-slate-900/70 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-500/10 p-2 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                        <Mail className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-cyan-100 font-medium">{src.emailAddress}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="capitalize">{src.sourceType}</span>
                          <span>•</span>
                          <span>Added {new Date(src.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">Active</span>
                      </div>
                      <Button
                        onClick={() => handleDeleteSource(src.id)}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800/50 border-red-900/50 text-red-400 hover:bg-red-950/50 hover:border-red-700/50 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Source Button */}
            <Button
              onClick={handleAddGmailSource}
              disabled={isAddingSource}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white w-full shadow-lg shadow-cyan-900/30 transition-all duration-300"
            >
              {isAddingSource ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gmail Account
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-cyan-100 flex items-center gap-2">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Receipt className="w-5 h-5 text-cyan-400" />
              </div>
              Recent Invoices
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your latest invoice records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoadingInvoices && (
              <div className="text-center py-8 text-slate-400">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-cyan-400" />
                <p className="mt-4">Loading invoices...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingInvoices && invoices.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="p-4 bg-cyan-500/5 rounded-full w-fit mx-auto mb-3">
                  <Receipt className="w-12 h-12 text-cyan-500/50" />
                </div>
                <p className="mb-2 text-cyan-100">No invoices found</p>
                <p className="text-sm text-slate-500">
                  Connect an email source to start importing invoices
                </p>
              </div>
            )}

            {/* Invoices List */}
            {!isLoadingInvoices && invoices.length > 0 && (
              <>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="group bg-slate-900/50 border border-cyan-900/30 rounded-xl p-5 hover:border-cyan-700/50 hover:bg-slate-900/70 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-cyan-100 font-semibold text-lg mb-1">
                            {invoice.vendorName || 'Unknown Vendor'}
                          </h3>
                          <p className="text-slate-400 text-sm flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-cyan-500/10 rounded text-cyan-400 text-xs font-mono">
                              {invoice.invoiceNumber || 'No Invoice Number'}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-200 font-bold text-xl mb-2">
                            {formatCurrency(invoice.totalAmount, invoice.currency)}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              invoice.paymentStatus
                            )}`}
                          >
                            {invoice.paymentStatus?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-cyan-900/20 pt-3 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Due Date
                          </span>
                          <span className="text-cyan-300 font-medium">{formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>

                      {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-cyan-900/20">
                          <p className="text-slate-400 text-xs font-medium mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Line Items
                          </p>
                          <div className="space-y-2">
                            {invoice.lineItems.map((item, idx) => (
                              <div key={idx} className="text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded-lg border border-cyan-900/20">
                                <span className="text-cyan-300">•</span> {item.description}
                                {item.quantity !== undefined && item.unitPrice !== undefined && (
                                  <span className="text-slate-400 ml-2">
                                    — {item.quantity} × ${item.unitPrice}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="bg-slate-900/50 border-cyan-900/50 text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-700/50 transition-all duration-300"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Load More Invoices
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
