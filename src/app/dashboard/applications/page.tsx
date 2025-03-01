import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'My Applications | Nuonu',
  description: 'Manage your submitted applications',
}

interface Application {
  id: string
  created_at: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  proposal: string
  opportunity: {
    id: string
    title: string
    description: string
    budget: number
    deadline: string
    location: string
    category: string
  }
  blockchain_tx?: string
  feedback?: string
}

export default async function ApplicationsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/signin?redirect=/dashboard/applications')
  }
  
  const { data: applications, error } = await supabase
    .from('applications')
    .select('*, opportunity:opportunities(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching applications:', error)
  }
  
  const applicationsList = applications as unknown as Application[] || []
  
  const pendingApplications = applicationsList.filter(app => app.status === 'pending')
  const acceptedApplications = applicationsList.filter(app => app.status === 'accepted')
  const rejectedApplications = applicationsList.filter(app => app.status === 'rejected' || app.status === 'withdrawn')

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Applications</h1>
      
      {applicationsList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No applications yet</CardTitle>
            <CardDescription>
              You haven't submitted any applications yet. Browse opportunities to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/opportunities">
              <Button>Browse Opportunities</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({applicationsList.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({acceptedApplications.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-6">
            {applicationsList.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingApplications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
          
          <TabsContent value="accepted" className="space-y-4 mt-6">
            {acceptedApplications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4 mt-6">
            {rejectedApplications.map(application => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ApplicationCard({ application }: { application: Application }) {
  const statusColors = {
    pending: "bg-yellow-500",
    accepted: "bg-green-500",
    rejected: "bg-red-500",
    withdrawn: "bg-gray-500"
  }
  
  const formattedDate = new Date(application.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  const deadlineDate = new Date(application.opportunity.deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{application.opportunity.title}</CardTitle>
            <CardDescription>Applied on {formattedDate}</CardDescription>
          </div>
          <Badge className={statusColors[application.status]}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
              <span>${application.opportunity.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span>Deadline: {deadlineDate}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{application.opportunity.category}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>{application.opportunity.location}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Your Proposal</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {application.proposal.length > 150 
                ? `${application.proposal.substring(0, 150)}...` 
                : application.proposal}
            </p>
          </div>
          
          {application.feedback && (
            <div>
              <h4 className="font-medium mb-1">Feedback</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{application.feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardContent className="flex justify-end pt-0">
        <Link href={`/dashboard/applications/${application.id}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      </CardContent>
    </Card>
  )
} 