import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AgentActivitiesList } from './components/AgentActivitiesList'
import { AgentControls } from './components/AgentControls'
import { AgentKitPanel } from './components/AgentKitPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata = {
  title: 'AI Agent Dashboard',
  description: 'View and manage your AI agent activities',
}

export default async function AgentDashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get the user's artists
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  // If no artists, redirect to create artist page
  if (!artists || artists.length === 0) {
    redirect('/dashboard/artists/new')
  }

  // Use the first artist for now
  const artistId = artists[0].id

  // Get agent activities for this artist
  const { data: activities } = await supabase
    .from('agent_activities')
    .select('*')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">AI Agent Dashboard</h1>
      
      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="controls">Agent Controls</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>
        
        <TabsContent value="controls" className="space-y-6">
          <AgentControls artistId={artistId} />
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-6">
          <AgentActivitiesList activities={activities || []} />
        </TabsContent>
        
        <TabsContent value="blockchain" className="space-y-6">
          <AgentKitPanel artistId={artistId} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 