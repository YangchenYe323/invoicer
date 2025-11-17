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
      icon: <Mail className="w-12 h-12 text-blue-400" />,
      title: 'Email Integration',
      description:
        'Connect your Gmail account securely and automatically extract invoices from your inbox.',
    },
    {
      icon: <FileText className="w-12 h-12 text-blue-400" />,
      title: 'Smart Detection',
      description:
        'Automatically detect and extract invoice data including vendor, amount, and due dates.',
    },
    {
      icon: <Receipt className="w-12 h-12 text-blue-400" />,
      title: 'Organized View',
      description:
        'All your invoices in one place with powerful search and filtering capabilities.',
    },
    {
      icon: <Shield className="w-12 h-12 text-blue-400" />,
      title: 'Secure Storage',
      description:
        'Your data is encrypted and stored securely with industry-standard security practices.',
    },
    {
      icon: <Sparkles className="w-12 h-12 text-blue-400" />,
      title: 'Insights & Analytics',
      description:
        'Track spending patterns and get insights into your business expenses over time.',
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-blue-400" />,
      title: 'Payment Tracking',
      description:
        'Mark invoices as paid and keep track of outstanding balances effortlessly.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <Receipt className="w-16 h-16 text-blue-400" />
              <h1 className="text-6xl md:text-7xl font-black text-white">
                Invoicer
              </h1>
            </div>
          </div>
          <p className="text-3xl md:text-4xl text-gray-200 mb-6 font-light">
            Never lose track of an invoice again
          </p>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Automatically extract and organize invoices from your email.
            Stay on top of payments and expenses with intelligent tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50 group">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Everything you need to manage invoices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <CardContent className="p-6">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to streamline your invoice management?
            </h2>
            <p className="text-gray-300 mb-8">
              Join and start organizing your invoices today.
            </p>
            <Link to="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50">
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
