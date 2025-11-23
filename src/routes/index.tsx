import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  Mail,
  FileText,
  Receipt,
  Shield,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSessionFn } from '@/lib/auth-server'

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: async (_ctx) => {
    const session = await getSessionFn()
    if (session?.user) {
      throw redirect({ to: '/dashboard/', replace: true })
    }
  },
})

function App() {
  const features = [
    {
      icon: <Mail className="w-12 h-12 text-cyan-400" />,
      title: 'Email Integration',
      description:
        'Connect your Gmail account securely and automatically extract invoices from your inbox.',
    },
    {
      icon: <FileText className="w-12 h-12 text-teal-400" />,
      title: 'Smart Detection',
      description:
        'Automatically detect and extract invoice data including vendor, amount, and due dates.',
    },
    {
      icon: <Receipt className="w-12 h-12 text-emerald-400" />,
      title: 'Organized View',
      description:
        'All your invoices in one place with powerful search and filtering capabilities.',
    },
    {
      icon: <Shield className="w-12 h-12 text-cyan-400" />,
      title: 'Secure Storage',
      description:
        'Your data is encrypted and stored securely with industry-standard security practices.',
    },
    {
      icon: <Sparkles className="w-12 h-12 text-teal-400" />,
      title: 'Insights & Analytics',
      description:
        'Track spending patterns and get insights into your business expenses over time.',
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-emerald-400" />,
      title: 'Payment Tracking',
      description:
        'Mark invoices as paid and keep track of outstanding balances effortlessly.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-emerald-500/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg blur-lg opacity-50" />
                <Receipt className="w-16 h-16 text-cyan-400 relative" />
              </div>
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Invoicer
              </h1>
            </div>
          </div>
          <p className="text-3xl md:text-4xl text-cyan-100 mb-6 font-light">
            Never lose track of an invoice again
          </p>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
            Automatically extract and organize invoices from your email.
            Stay on top of payments and expenses with intelligent tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-900/50 group transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="bg-slate-900/50 hover:bg-slate-800/50 text-cyan-300 border-cyan-900/50 hover:border-cyan-700/50 transition-all duration-300">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent text-center mb-12">
          Everything you need to manage invoices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border-cyan-900/30 hover:border-cyan-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="mb-4 p-3 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <Card className="bg-gradient-to-br from-cyan-600/20 via-teal-600/20 to-emerald-600/20 border-cyan-500/30 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/10" />
          <CardContent className="p-12 relative">
            <h2 className="text-3xl font-bold text-cyan-100 mb-4">
              Ready to streamline your invoice management?
            </h2>
            <p className="text-slate-300 mb-8">
              Join and start organizing your invoices today.
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-900/50 transition-all duration-300">
                Sign Up Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
