"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"

interface Grant {
  id: number
  category: string
  title: string
  deadline: string
  overview: string
  link: string
  matchScore?: number
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [applyingTo, setApplyingTo] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial position
    
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchGrants = async () => {
      setIsLoading(true)
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // For unauthenticated users, we'll show some sample grants
          // In a real app, you might redirect to sign in or show limited content
          setGrants([
            {
              id: 1,
              category: "Arts & Culture",
              title: "Creative Expression Fund",
              deadline: "March 15, 2026",
              overview: "Supporting innovative projects in visual arts, performance, and digital media.",
              link: "https://example.com/creative-fund",
              matchScore: 95
            },
            {
              id: 2,
              category: "Technology",
              title: "Digital Innovation Grant",
              deadline: "April 30, 2026",
              overview: "Funding for creators using technology to solve social challenges.",
              link: "https://example.com/tech-grant",
              matchScore: 88
            },
            {
              id: 3,
              category: "Education",
              title: "Community Learning Initiative",
              deadline: "May 20, 2026",
              overview: "Supporting educational content creators and learning platforms.",
              link: "https://example.com/education-grant",
              matchScore: 82
            },
            {
              id: 4,
              category: "Sustainability",
              title: "Green Creator Fund",
              deadline: "June 10, 2026",
              overview: "For creators focused on environmental sustainability and climate action.",
              link: "https://example.com/green-fund",
              matchScore: 75
            },
            {
              id: 5,
              category: "Social Impact",
              title: "Change Makers Grant",
              deadline: "July 5, 2026",
              overview: "Supporting creators addressing social inequalities and community challenges.",
              link: "https://example.com/social-impact",
              matchScore: 70
            },
          ])
          setIsLoading(false)
          return
        }
        
        // For authenticated users, fetch their matched grants
        const response = await fetch('/api/agent?action=matches', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch matches')
        }
        
        const data = await response.json()
        
        // Transform the data to match our Grant interface
        const transformedGrants: Grant[] = [
          ...data.highMatches.map((match: any) => ({
            id: match.id,
            category: match.category || 'Uncategorized',
            title: match.title,
            deadline: match.deadline || 'No deadline',
            overview: match.description || 'No description available',
            link: match.url || '#',
            matchScore: match.matchScore || 90
          })),
          ...data.mediumMatches.map((match: any) => ({
            id: match.id,
            category: match.category || 'Uncategorized',
            title: match.title,
            deadline: match.deadline || 'No deadline',
            overview: match.description || 'No description available',
            link: match.url || '#',
            matchScore: match.matchScore || 70
          }))
        ]
        
        setGrants(transformedGrants)
      } catch (err) {
        console.error("Error fetching grants:", err)
        setError("Failed to load your matched grants. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrants()
  }, [])

  const handleAutoApply = async (grantId: number) => {
    setApplyingTo(grantId)
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }
      
      // Call the agent API to auto-apply
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_application',
          userId: user.id,
          opportunityId: grantId
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate application')
      }
      
      alert("Application submitted successfully!")
    } catch (error) {
      console.error("Error applying:", error)
      alert("There was an error submitting your application. Please try again.")
    } finally {
      setApplyingTo(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Matched Grants</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Matched Grants</h1>
        <div className="bg-red-900 text-white p-4 rounded">
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-4 py-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header scrolled={scrolled} />
      <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Matched Grants</h1>
        <p className="text-left mb-8">
          Based on your profile, we've found these grants that match your background and interests.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white">
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Deadline</th>
                <th className="py-2 px-4 text-left">Overview</th>
                <th className="py-2 px-4 text-left">Match</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="py-3 px-4">{grant.category}</td>
                  <td className="py-3 px-4 font-medium">{grant.title}</td>
                  <td className="py-3 px-4">{grant.deadline}</td>
                  <td className="py-3 px-4">{grant.overview}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-white h-2.5 rounded-full" 
                          style={{ width: `${grant.matchScore || 0}%` }}
                        ></div>
                      </div>
                      <span className="ml-2">{grant.matchScore || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-2">
                      <a
                        href={grant.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-white underline hover:text-gray-300"
                      >
                        View Grant
                      </a>
                      <Button
                        onClick={() => handleAutoApply(grant.id)}
                        disabled={applyingTo === grant.id}
                        className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-3 py-1 text-xs"
                      >
                        {applyingTo === grant.id ? "Applying..." : "Auto-apply with AI"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
} 