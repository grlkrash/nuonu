"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FixedHeader } from "@/components/layout/fixed-header"

interface Grant {
  id: number
  category: string
  title: string
  deadline: string
  overview: string
  link: string
  status?: string
}

export default function ProfilePage() {
  const [grants, setGrants] = useState<Grant[]>([])
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
          router.push('/signin')
          return
        }
        
        // Fetch user's matched grants from the database
        const { data, error } = await supabase
          .from('matched_opportunities')
          .select('*, opportunity:opportunities(*)')
          .eq('user_id', user.id)
        
        if (error) throw error
        
        // Transform data to match the Grant interface
        const transformedGrants: Grant[] = data.map((match) => ({
          id: match.opportunity.id,
          category: match.opportunity.category || 'Uncategorized',
          title: match.opportunity.title,
          deadline: match.opportunity.deadline || 'No deadline',
          overview: match.opportunity.description || 'No description available',
          link: match.opportunity.url || '#',
          status: match.status || 'Not applied'
        }))
        
        setGrants(transformedGrants)
      } catch (err) {
        console.error("Error fetching grants:", err)
        setError("Failed to load your matched grants. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrants()
  }, [router])

  const handleAutoApply = async (grantId: number) => {
    try {
      // Get user
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
      
      // Update the local state to reflect the application
      setGrants(grants.map(grant => 
        grant.id === grantId 
          ? { ...grant, status: 'Application in progress' } 
          : grant
      ))
      
      alert("Application process started! You'll receive updates on your dashboard.")
    } catch (error) {
      console.error("Error applying:", error)
      alert("There was an error starting the application process. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-4 w-1/4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
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
      <FixedHeader />
      <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>
          <h2 className="text-2xl font-bold mb-4">Matched Grants</h2>
          {grants.length === 0 ? (
            <p>You don't have any matched grants yet. Complete your profile to get personalized matches.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white">
                    <th className="py-2 px-4 text-left">Category</th>
                    <th className="py-2 px-4 text-left">Title</th>
                    <th className="py-2 px-4 text-left">Deadline</th>
                    <th className="py-2 px-4 text-left">Overview</th>
                    <th className="py-2 px-4 text-left">Status</th>
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
                      <td className="py-3 px-4">{grant.status || 'Not applied'}</td>
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
                          {(!grant.status || grant.status === 'Not applied') && (
                            <Button 
                              onClick={() => handleAutoApply(grant.id)}
                              className="bg-transparent text-white border border-white hover:bg-white hover:text-black rounded-xl px-3 py-1 text-xs"
                            >
                              Auto-apply with AI
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 