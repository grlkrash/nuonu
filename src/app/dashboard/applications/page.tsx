'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, DollarSign, MapPin, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

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

export const metadata = {
  title: 'My Applications | Nuonu',
  description: 'Manage your submitted applications',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return
        }
        
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            created_at,
            status,
            proposal,
            blockchain_tx,
            feedback,
            opportunity:opportunity_id (
              id,
              title,
              description,
              budget,
              deadline,
              location,
              category
            )
          `)
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setApplications(data || [])
      } catch (error) {
        console.error('Error fetching applications:', error)
        toast({
          title: 'Error',
          description: 'Failed to load your applications. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplications()
  }, [toast])
  
  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeTab)
  
  const withdrawApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId)
      
      if (error) throw error
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'withdrawn' as const } 
            : app
        )
      )
      
      toast({
        title: 'Application withdrawn',
        description: 'Your application has been successfully withdrawn.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast({
        title: 'Error',
        description: 'Failed to withdraw your application. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      case 'withdrawn':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Withdrawn</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }
  
  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'withdrawn':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return null
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track and manage your opportunity applications
          </p>
        </div>
        
        <Link href="/opportunities">
          <Button className="mt-4 md:mt-0">
            Browse Opportunities
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {activeTab === 'all' 
                  ? "You haven't applied to any opportunities yet." 
                  : `You don't have any ${activeTab} applications.`}
              </p>
              <Link href="/opportunities">
                <Button>Browse Opportunities</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredApplications.map(application => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{application.opportunity.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Applied on {formatDate(application.created_at)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(application.status)}
                        <span className="ml-2">{getStatusBadge(application.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Deadline: {application.opportunity.deadline ? formatDate(application.opportunity.deadline) : 'No deadline'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Budget: {application.opportunity.budget ? `$${application.opportunity.budget.toLocaleString()}` : 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Location: {application.opportunity.location || 'Remote'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Badge variant="outline" className="font-normal">
                          {application.opportunity.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Your Proposal</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {application.proposal.length > 200 
                          ? `${application.proposal.substring(0, 200)}...` 
                          : application.proposal}
                      </p>
                    </div>
                    
                    {application.blockchain_tx && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <h4 className="text-sm font-medium mb-1">Blockchain Transaction</h4>
                        <div className="flex items-center">
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {application.blockchain_tx.substring(0, 20)}...
                          </code>
                          <a 
                            href={`https://basescan.org/tx/${application.blockchain_tx}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {application.feedback && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-1">Feedback</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {application.feedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Link href={`/opportunities/${application.opportunity.id}`}>
                      <Button variant="outline">View Opportunity</Button>
                    </Link>
                    
                    {application.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => withdrawApplication(application.id)}
                      >
                        Withdraw Application
                      </Button>
                    )}
                    
                    {application.status === 'accepted' && (
                      <Link href={`/dashboard/applications/${application.id}/contract`}>
                        <Button>View Contract</Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 