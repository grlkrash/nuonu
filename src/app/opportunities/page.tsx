"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimulatedAutoApply } from "@/components/demo/SimulatedAutoApply"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function OpportunitiesPage() {
  const searchParams = useSearchParams()
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  
  const opportunities: Opportunity[] = [
    {
      id: "opp_123456",
      title: "Music Production Grant",
      organization: "Base Foundation",
      deadline: "2023-08-15",
      amount: "$5,000",
      description: "Funding for independent artists to produce a new album or EP using blockchain technology for distribution.",
      location: "Remote",
      category: "Production"
    },
    {
      id: "opp_234567",
      title: "Web3 Music Residency",
      organization: "zkSync Community",
      deadline: "2023-09-01",
      amount: "$10,000",
      description: "Three-month residency program for musicians exploring the intersection of music and blockchain technology.",
      location: "New York, NY",
      category: "Residency"
    },
    {
      id: "opp_345678",
      title: "Emerging Artist Showcase",
      organization: "Optimism Collective",
      deadline: "2023-08-30",
      amount: "$3,000",
      description: "Performance opportunity and funding for emerging artists to showcase their work at a major Web3 conference.",
      location: "Miami, FL",
      category: "Performance"
    }
  ]

  useEffect(() => {
    const selectedId = searchParams.get("selected")
    if (selectedId) {
      const opportunity = opportunities.find(opp => opp.id === selectedId)
      if (opportunity) {
        setSelectedOpportunity(opportunity)
      }
    }
  }, [searchParams])

  const handleSelectOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Funding Opportunities</h1>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id} className="p-6 hover:border-primary transition-all cursor-pointer" onClick={() => handleSelectOpportunity(opportunity)}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{opportunity.title}</h3>
              <Badge variant={opportunity.id === selectedOpportunity?.id ? "default" : "outline"}>
                {opportunity.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Organization:</span>
                <span>{opportunity.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span>{opportunity.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Deadline:</span>
                <span>{opportunity.deadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Location:</span>
                <span>{opportunity.location}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedOpportunity ? (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Apply for {selectedOpportunity.title}</h2>
          <SimulatedAutoApply opportunityId={selectedOpportunity.id} artistId="artist_123456" />
        </div>
      ) : (
        <Card className="p-6 bg-muted/50">
          <h2 className="text-xl font-semibold mb-2">Application Tips</h2>
          <p className="text-muted-foreground mb-4">
            Select an opportunity above to begin the application process. Our AI-powered system will help you complete your application efficiently.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Make sure your artist profile is complete for best results</li>
            <li>Applications are processed using secure blockchain technology</li>
            <li>You can track the status of your applications in your dashboard</li>
          </ul>
        </Card>
      )}
    </div>
  )
}

interface Opportunity {
  id: string
  title: string
  organization: string
  deadline: string
  amount: string
  description: string
  location: string
  category: string
}