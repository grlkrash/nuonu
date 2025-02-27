'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Search, FileText, Send, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { AgentActivity, AgentActivityStatus, AgentActivityType } from '@/lib/services/agent-activities'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface AgentActivityDashboardProps {
  userId: string
}

export function AgentActivityDashboard({ userId }: AgentActivityDashboardProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [autoMode, setAutoMode] = useState(false)
  const [discovering, setDiscovering] = useState(false)

  // Fetch recent activities
  useEffect(() => {
    async function fetchActivities() {
      try {
        const { data, error } = await supabase
          .from('agent_activities')
          .select('*')
          .eq('artist_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) throw error
        
        setActivities(data || [])
      } catch (error) {
        console.error('Error fetching agent activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('agent_activities_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agent_activities',
        filter: `artist_id=eq.${userId}`
      }, (payload) => {
        // Refresh activities when changes occur
        fetchActivities()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Handle auto mode toggle
  const handleAutoModeToggle = async (checked: boolean) => {
    setAutoMode(checked)
    
    if (checked) {
      // Trigger autonomous agent
      try {
        const response = await fetch('/api/agent/autonomous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artistId: userId }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to start autonomous agent')
        }
      } catch (error) {
        console.error('Error starting autonomous agent:', error)
        setAutoMode(false)
      }
    }
  }

  // Handle manual discovery
  const handleManualDiscovery = async () => {
    setDiscovering(true)
    
    try {
      const response = await fetch('/api/agent/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          artistId: userId,
          source: 'eliza-twitter'
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to discover opportunities')
      }
    } catch (error) {
      console.error('Error discovering opportunities:', error)
    } finally {
      setDiscovering(false)
    }
  }

  // Get icon for activity type
  const getActivityIcon = (type: AgentActivityType) => {
    switch (type) {
      case AgentActivityType.OPPORTUNITY_DISCOVERY:
        return <Search className="h-4 w-4 mr-2" />
      case AgentActivityType.OPPORTUNITY_MATCHING:
        return <CheckCircle className="h-4 w-4 mr-2" />
      case AgentActivityType.APPLICATION_GENERATION:
        return <FileText className="h-4 w-4 mr-2" />
      case AgentActivityType.APPLICATION_SUBMISSION:
        return <Send className="h-4 w-4 mr-2" />
      case AgentActivityType.FUND_DISTRIBUTION:
        return <RefreshCw className="h-4 w-4 mr-2" />
      case AgentActivityType.BLOCKCHAIN_INTERACTION:
        return <RefreshCw className="h-4 w-4 mr-2" />
      default:
        return <Clock className="h-4 w-4 mr-2" />
    }
  }

  // Get status badge for activity
  const getStatusBadge = (status: AgentActivityStatus) => {
    switch (status) {
      case AgentActivityStatus.COMPLETED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>
      case AgentActivityStatus.IN_PROGRESS:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>
      case AgentActivityStatus.FAILED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
      case AgentActivityStatus.PENDING:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
      default:
        return null
    }
  }

  // Get activity description
  const getActivityDescription = (activity: AgentActivity) => {
    switch (activity.activity_type) {
      case AgentActivityType.OPPORTUNITY_DISCOVERY:
        return `Discovered ${activity.details?.opportunities_found || 0} opportunities from ${activity.details?.source || 'unknown source'}`
      case AgentActivityType.OPPORTUNITY_MATCHING:
        return `Matched ${activity.details?.opportunities_matched || 0} opportunities to your profile`
      case AgentActivityType.APPLICATION_GENERATION:
        return `Generated application for opportunity ${activity.details?.opportunity_id}`
      case AgentActivityType.APPLICATION_SUBMISSION:
        return `Submitted application ${activity.details?.application_id}`
      case AgentActivityType.FUND_DISTRIBUTION:
        return `Distributed funds for application ${activity.details?.application_id}`
      case AgentActivityType.BLOCKCHAIN_INTERACTION:
        return `Interacted with blockchain for ${activity.details?.action || 'unknown action'}`
      default:
        return 'Unknown activity'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">AI Agent Activity</CardTitle>
        <CardDescription>
          Recent actions taken by your AI agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-mode"
              checked={autoMode}
              onCheckedChange={handleAutoModeToggle}
            />
            <Label htmlFor="auto-mode">Auto Mode</Label>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualDiscovery}
            disabled={discovering}
          >
            {discovering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Discover Opportunities
              </>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No agent activities yet. Toggle auto mode or click "Discover Opportunities" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="border rounded-lg p-4 flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getActivityIcon(activity.activity_type)}
                    <span className="font-medium">
                      {activity.activity_type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </span>
                  </div>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-gray-600">
                  {getActivityDescription(activity)}
                </p>
                <div className="text-xs text-gray-400">
                  {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Powered by Eliza OS on Flow blockchain
        </div>
      </CardFooter>
    </Card>
  )
} 