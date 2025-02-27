'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useUser } from '@/lib/auth-hooks'

interface ExternalApplicationStatusProps {
  opportunityId: string
  opportunityTitle: string
  submissionId: string
  initialStatus?: 'pending' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'unknown'
}

export function ExternalApplicationStatus({
  opportunityId,
  opportunityTitle,
  submissionId,
  initialStatus = 'submitted'
}: ExternalApplicationStatusProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [lastChecked, setLastChecked] = useState<Date | null>(new Date())

  const statusIcons = {
    pending: <Clock className="h-5 w-5 text-yellow-500" />,
    submitted: <CheckCircle className="h-5 w-5 text-blue-500" />,
    under_review: <Clock className="h-5 w-5 text-purple-500" />,
    accepted: <CheckCircle className="h-5 w-5 text-green-500" />,
    rejected: <AlertCircle className="h-5 w-5 text-red-500" />,
    unknown: <AlertCircle className="h-5 w-5 text-gray-500" />
  }

  const statusMessages = {
    pending: 'Your application is pending submission.',
    submitted: 'Your application has been submitted successfully.',
    under_review: 'Your application is currently under review.',
    accepted: 'Congratulations! Your application has been accepted.',
    rejected: 'Unfortunately, your application has been rejected.',
    unknown: 'The status of your application is unknown.'
  }

  const checkStatus = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to check application status.',
        variant: 'destructive'
      })
      return
    }

    setIsChecking(true)

    try {
      const response = await fetch('/api/agent/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: user.id,
          opportunityId,
          submissionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check application status')
      }

      const data = await response.json()
      
      if (data.status) {
        setStatus(data.status)
      }
      
      setLastChecked(new Date())
      
      toast({
        title: 'Status Updated',
        description: 'The application status has been updated.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error checking application status:', error)
      toast({
        title: 'Status Check Failed',
        description: 'We couldn\'t check your application status. Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Format the last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - lastChecked.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">External Application Status</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="font-medium">Opportunity:</div>
            <div>{opportunityTitle}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="font-medium">Status:</div>
            <div className="flex items-center space-x-2">
              {statusIcons[status]}
              <span>{statusMessages[status]}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="font-medium">Submission ID:</div>
            <div className="text-sm font-mono">{submissionId}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="font-medium">Last Checked:</div>
            <div>{formatLastChecked()}</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={checkStatus} 
          disabled={isChecking}
          variant="outline"
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Status...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 