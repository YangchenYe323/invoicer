import { createFileRoute, redirect, useRouteContext } from '@tanstack/react-router'
import { getSessionFn } from '@/lib/auth-server'
import DashboardLayout from '@/components/DashboardLayout'

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async (_ctx) => {
    const session = await getSessionFn()
    if (session?.user) {
      return { session }
    }
    throw redirect({ to: '/login' })
  },
  component: Dashboard,
})

function Dashboard() {
  const { session } = useRouteContext({ from: '/dashboard/' })
  return <DashboardLayout session={session} />
}
