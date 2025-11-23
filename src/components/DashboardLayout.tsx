import { useState, useEffect } from 'react'
import { Receipt, LogOut, Mail, Plus, FileText, DollarSign, Calendar, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/db'
import { source } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSessionFn } from '@/lib/auth-server'
import { z } from 'zod'

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

interface DashboardLayoutProps {
  session: any 
}

// Fake invoice data
const fakeInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    vendorName: 'AWS Services',
    totalAmount: '2,450.00',
    currency: 'USD',
    dueDate: '2024-12-15',
    paymentStatus: 'unpaid',
    lineItems: [
      { description: 'EC2 Instances', quantity: 5, unitPrice: 350 },
      { description: 'S3 Storage', quantity: 1, unitPrice: 700 },
    ],
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    vendorName: 'Adobe Creative Cloud',
    totalAmount: '79.99',
    currency: 'USD',
    dueDate: '2024-11-20',
    paymentStatus: 'paid',
    lineItems: [
      { description: 'Creative Cloud All Apps', quantity: 1, unitPrice: 79.99 },
    ],
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    vendorName: 'Vercel',
    totalAmount: '150.00',
    currency: 'USD',
    dueDate: '2024-12-01',
    paymentStatus: 'pending',
    lineItems: [
      { description: 'Pro Plan', quantity: 1, unitPrice: 150 },
    ],
  },
  {
    id: 4,
    invoiceNumber: 'INV-2024-004',
    vendorName: 'GitHub',
    totalAmount: '21.00',
    currency: 'USD',
    dueDate: '2024-11-25',
    paymentStatus: 'paid',
    lineItems: [
      { description: 'Team Plan', quantity: 1, unitPrice: 21 },
    ],
  },
]

export default function DashboardLayout({ session }: DashboardLayoutProps) {
  const router = useRouter()
  const [invoices] = useState(fakeInvoices)
  const [isAddingSource, setIsAddingSource] = useState(false)
  const [sources, setSources] = useState<Array<{
    id: number
    name: string
    emailAddress: string
    sourceType: string
    createdAt: Date
  }>>([])
  const [isLoadingSources, setIsLoadingSources] = useState(true)

  useEffect(() => {
    const loadSources = async () => {
      try {
        const data = await getUserSources()
        setSources(data)
      } catch (error) {
        console.error('Failed to load sources:', error)
      } finally {
        setIsLoadingSources(false)
      }
    }
    loadSources()
  }, [])

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
      setSources(sources.filter(s => s.id !== sourceId))
    } catch (error) {
      console.error('Failed to delete source:', error)
      alert('Failed to delete source')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'unpaid':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const stats = {
    total: invoices.length,
    unpaid: invoices.filter((i) => i.paymentStatus === 'unpaid').length,
    totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.totalAmount.replace(',', '')), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-black text-white">Invoicer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              Welcome, <span className="text-white font-medium">{session.user.name}</span>
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
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
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Total Invoices</CardDescription>
              <CardTitle className="text-3xl text-white">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <FileText className="w-8 h-8 text-blue-400" />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Unpaid Invoices</CardDescription>
              <CardTitle className="text-3xl text-white">{stats.unpaid}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar className="w-8 h-8 text-red-400" />
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Total Amount</CardDescription>
              <CardTitle className="text-3xl text-white">
                ${stats.totalAmount.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DollarSign className="w-8 h-8 text-green-400" />
            </CardContent>
          </Card>
        </div>

        {/* Email Sources Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Sources
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your email accounts to automatically import invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {isLoadingSources && (
              <div className="text-center py-4 text-gray-400">
                Loading sources...
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSources && sources.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="mb-4">No email sources connected yet</p>
              </div>
            )}

            {/* Existing Sources */}
            {!isLoadingSources && sources.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-gray-300">Connected Accounts</p>
                {sources.map((src) => (
                  <div
                    key={src.id}
                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:border-blue-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{src.emailAddress}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <span className="capitalize">{src.sourceType}</span>
                          <span>•</span>
                          <span>Added {new Date(src.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Active</span>
                      </div>
                      <Button
                        onClick={() => handleDeleteSource(src.id)}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800 border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
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
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingSource ? 'Connecting...' : 'Add Gmail Account'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recent Invoices
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your latest invoice records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold">{invoice.vendorName}</h3>
                      <p className="text-gray-400 text-sm">{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        {invoice.currency} ${invoice.totalAmount}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          invoice.paymentStatus
                        )}`}
                      >
                        {invoice.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Due Date:</span>
                      <span className="text-white">{invoice.dueDate}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-400 text-xs mb-2">Line Items:</p>
                    {invoice.lineItems.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-300 ml-2">
                        • {item.description} - {item.quantity} × ${item.unitPrice}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
