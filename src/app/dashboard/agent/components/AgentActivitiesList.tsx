'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface AgentActivity {
  id: string
  artist_id: string
  activity_type: string
  status: 'in_progress' | 'completed' | 'failed'
  details: any
  created_at: string
  updated_at: string
}

interface AgentActivitiesListProps {
  activities: AgentActivity[]
}

export function AgentActivitiesList({ activities }: AgentActivitiesListProps) {
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedActivity(expandedActivity === id ? null : id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Activities</CardTitle>
          <CardDescription>
            No activities found for this artist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Your agent hasn't performed any activities yet. Run the agent to see activities here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Activities</CardTitle>
        <CardDescription>
          Recent activities performed by your AI agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <Collapsible
              key={activity.id}
              open={expandedActivity === activity.id}
              onOpenChange={() => toggleExpand(activity.id)}
              className="border rounded-md"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(activity.status)}>
                    <span className="flex items-center">
                      {getStatusIcon(activity.status)}
                      <span className="ml-1 capitalize">{activity.status}</span>
                    </span>
                  </Badge>
                  <div>
                    <h3 className="font-medium">{formatActivityType(activity.activity_type)}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {expandedActivity === activity.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0">
                  <div className="rounded-md bg-muted p-3">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-[300px]">
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Showing the {activities.length} most recent activities
        </p>
      </CardFooter>
    </Card>
  )
} 