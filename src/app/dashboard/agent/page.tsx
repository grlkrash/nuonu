import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AgentActivityDashboard } from '@/components/dashboard/agent-activity-dashboard'

export const metadata = {
  title: 'AI Agent Dashboard',
  description: 'View and manage your AI agent activities',
}

export default async function AgentDashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  const userId = session.user.id
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI Agent Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Monitor your AI agent's activities and manage autonomous operations.
      </p>
      
      <div className="grid grid-cols-1 gap-8">
        <AgentActivityDashboard userId={userId} />
      </div>
    </div>
  )
} 