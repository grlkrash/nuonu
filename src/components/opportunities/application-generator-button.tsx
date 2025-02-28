'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { walletAbstraction } from '@/lib/blockchain/wallet-abstraction'
import { contractManager } from '@/lib/blockchain/contracts'

interface ApplicationGeneratorButtonProps {
  opportunityId: string
  opportunityTitle: string
}

export function ApplicationGeneratorButton({ opportunityId, opportunityTitle }: ApplicationGeneratorButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockchainStatus, setBlockchainStatus] = useState<{
    base?: { hash: string; status: string }
    zksync?: { hash: string; status: string }
  }>({})
  const [generatedContent, setGeneratedContent] = useState<{
    artistStatement: string
    projectDescription: string
    budget: string
    timeline: string
    impactStatement: string
  } | null>(null)

  const handleGenerateApplication = async () => {
    setIsGenerating(true)
    setShowDialog(true)

    try {
      // In a real implementation, this would call the AI agent
      // For demo, we'll simulate the generation with a delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      setGeneratedContent({
        artistStatement: "As a dedicated artist exploring the intersection of traditional and digital media, I am passionate about creating work that challenges conventional boundaries and engages with contemporary social issues. My practice is deeply rooted in experimental techniques and collaborative approaches, reflecting my commitment to innovation in the arts.",
        projectDescription: "This project aims to create an immersive multimedia installation that combines traditional painting techniques with augmented reality elements. Through this work, I will explore themes of digital identity and human connection in our increasingly virtual world.\n\nThe installation will feature a series of large-scale paintings that serve as anchors for AR experiences, allowing viewers to interact with the work through their mobile devices. This interaction will reveal layers of digital content, including animated elements, sound design, and participatory components.",
        budget: "• Artist Fee: $2,000\n• Materials (Canvas, Paint, etc.): $1,000\n• Digital Equipment: $1,000\n• AR Development: $500\n• Installation Costs: $300\n• Documentation: $200\nTotal: $5,000",
        timeline: "• Month 1: Research and concept development\n• Month 2: Creation of physical artworks\n• Month 3: Digital content development\n• Month 4: AR integration and testing\n• Month 5: Installation and documentation",
        impactStatement: "This project will contribute to the evolving dialogue between traditional and digital art forms, offering audiences a unique perspective on how technology can enhance rather than replace traditional artistic practices. By making the work accessible through mobile devices, it will reach a broader audience and demonstrate new possibilities for artistic engagement in the digital age."
      })

      toast({
        title: 'Application Generated',
        description: 'Your application has been generated successfully.',
      })
    } catch (error) {
      console.error('Error generating application:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate application. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!generatedContent) return

    setIsSubmitting(true)
    
    try {
      // Check wallet connection
      const walletState = walletAbstraction.getState()
      if (!walletState.baseWallet && !walletState.zkSyncWallet) {
        throw new Error('Please connect your wallet first')
      }

      // Create application in database
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          proposal: JSON.stringify(generatedContent),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit application')
      }

      const data = await response.json()

      // Update blockchain status
      setBlockchainStatus(prev => ({
        ...prev,
        base: { hash: data.transaction_hash, status: 'Submitted' },
        zksync: data.zksync_transaction_hash 
          ? { hash: data.zksync_transaction_hash, status: 'Submitted' }
          : undefined
      }))

      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully to the blockchain.',
      })

      // Close dialog after short delay
      setTimeout(() => {
        setShowDialog(false)
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleGenerateApplication}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Application'
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black text-white">
          <DialogHeader>
            <DialogTitle>Generated Application for {opportunityTitle}</DialogTitle>
            <DialogDescription>
              Review and edit the generated content before submitting.
            </DialogDescription>
          </DialogHeader>

          {generatedContent ? (
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-medium mb-2">Artist Statement</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{generatedContent.artistStatement}</p>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Project Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{generatedContent.projectDescription}</p>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Budget</h3>
                <pre className="text-gray-300 whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded-lg">
                  {generatedContent.budget}
                </pre>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Timeline</h3>
                <pre className="text-gray-300 whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded-lg">
                  {generatedContent.timeline}
                </pre>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Impact Statement</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{generatedContent.impactStatement}</p>
              </section>

              {blockchainStatus.base || blockchainStatus.zksync ? (
                <section className="border-t border-gray-800 pt-4">
                  <h3 className="text-lg font-medium mb-2">Blockchain Status</h3>
                  <div className="space-y-2">
                    {blockchainStatus.base && (
                      <div className="flex items-center justify-between">
                        <span>Base Network:</span>
                        <a
                          href={`https://goerli.basescan.org/tx/${blockchainStatus.base.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {blockchainStatus.base.status}
                        </a>
                      </div>
                    )}
                    {blockchainStatus.zksync && (
                      <div className="flex items-center justify-between">
                        <span>zkSync Network:</span>
                        <a
                          href={`https://goerli.explorer.zksync.io/tx/${blockchainStatus.zksync.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {blockchainStatus.zksync.status}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 