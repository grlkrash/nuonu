'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Play, Settings, Zap } from 'lucide-react'

interface AgentControlsProps {
  artistId: string
}

export function AgentControls({ artistId }: AgentControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [autonomousMode, setAutonomousMode] = useState(false)
  const [creativeMode, setCreativeMode] = useState(false)
  const [blockchainEnabled, setBlockchainEnabled] = useState(false)

  const runAgent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId,
          instructions,
          autonomousMode,
          creativeMode,
          blockchainEnabled,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run agent')
      }

      toast({
        title: 'Agent Started',
        description: 'The agent has started running. Check the activities tab for updates.',
      })
      router.refresh()
    } catch (error) {
      console.error('Error running agent:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run agent',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Controls</CardTitle>
          <CardDescription>
            Configure and run your AI agent to discover and apply for opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Enter specific instructions for the agent (optional)..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autonomous-mode">Autonomous Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the agent to run continuously without human intervention
                </p>
              </div>
              <Switch
                id="autonomous-mode"
                checked={autonomousMode}
                onCheckedChange={setAutonomousMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="creative-mode">Creative Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Give the agent more creative freedom in generating applications
                </p>
              </div>
              <Switch
                id="creative-mode"
                checked={creativeMode}
                onCheckedChange={setCreativeMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="blockchain-enabled">Blockchain Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable blockchain interactions for grant distribution
                </p>
              </div>
              <Switch
                id="blockchain-enabled"
                checked={blockchainEnabled}
                onCheckedChange={setBlockchainEnabled}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="flex space-x-2">
            <Button 
              onClick={runAgent} 
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : autonomousMode ? (
                <Zap className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {autonomousMode ? 'Run Autonomous Agent' : 'Run Agent Once'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Capabilities</CardTitle>
          <CardDescription>
            What your AI agent can do for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc pl-5">
            <li>Discover grant and funding opportunities for artists</li>
            <li>Match opportunities with your artist profile</li>
            <li>Generate personalized applications</li>
            <li>Submit applications on your behalf (with your approval)</li>
            <li>Monitor application status</li>
            <li>Manage blockchain interactions for grant distribution</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 