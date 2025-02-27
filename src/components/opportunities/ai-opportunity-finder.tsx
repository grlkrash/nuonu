"use client"

import { useState, useEffect } from "react"
import { Sparkles, Search, Filter, Loader2, ArrowRight, Lightbulb, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OpportunityCard } from "./opportunity-card"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/lib/auth-hooks"
import { supabase } from "@/lib/supabase/client"

interface ArtistProfile {
  id?: string
  user_id?: string
  full_name?: string
  bio?: string
  location?: string
  artistic_discipline?: string
  experience_level?: string
  skills?: string
  interests?: string
  portfolio_url?: string
  social_links?: string
  created_at?: string
  updated_at?: string
}

interface Opportunity {
  id: string
  title: string
  description: string
  opportunity_type: 'grant' | 'job' | 'gig'
  organization: string
  amount: number
  deadline: string
  eligibility: string
  application_url: string
  source: string
  source_id: string
  created_at: string
  status?: 'open' | 'closed'
  category?: string
  is_remote?: boolean
  location?: string | null
  profiles?: any[] | null
  matchScore?: number
}

export function AIOpportunityFinder() {
  const { toast } = useToast()
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Opportunity[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [artistProfile, setArtistProfile] = useState<ArtistProfile>({
    artistic_discipline: "",
    experience_level: "",
    skills: "",
    interests: "",
    location: ""
  })
  const [newInterest, setNewInterest] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<Opportunity[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileRecommendations, setProfileRecommendations] = useState<{
    strengths: string[];
    improvements: string[];
    opportunityTypes: string[];
  } | null>(null)
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false)

  // Fetch user profile on component mount
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setIsLoadingProfile(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setArtistProfile({
            ...data,
            skills: data.skills || '',
            interests: data.interests || ''
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchUserProfile()
  }, [user, toast])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSearchResults([])
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search_opportunities',
          query: searchQuery
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to search opportunities')
      }
      
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error("Error searching opportunities:", error)
      toast({
        title: "Search Failed",
        description: "We couldn't complete your search. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddInterest = () => {
    if (newInterest && !artistProfile.interests?.includes(newInterest)) {
      setArtistProfile({
        ...artistProfile,
        interests: artistProfile.interests 
          ? `${artistProfile.interests},${newInterest}` 
          : newInterest
      })
      setNewInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    const interests = artistProfile.interests?.split(',').filter(i => i.trim() !== interest).join(',')
    setArtistProfile({
      ...artistProfile,
      interests
    })
  }

  const handleAddSkill = () => {
    if (newSkill && !artistProfile.skills?.includes(newSkill)) {
      setArtistProfile({
        ...artistProfile,
        skills: artistProfile.skills 
          ? `${artistProfile.skills},${newSkill}` 
          : newSkill
      })
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    const skills = artistProfile.skills?.split(',').filter(s => s.trim() !== skill).join(',')
    setArtistProfile({
      ...artistProfile,
      skills
    })
  }

  const generateAiSuggestions = async () => {
    setIsGeneratingSuggestions(true)
    setAiSuggestions([])
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'match_opportunities',
          profile: artistProfile
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate AI suggestions')
      }
      
      const data = await response.json()
      
      if (data.results) {
        const { highMatches, mediumMatches } = data.results
        setAiSuggestions([...highMatches, ...mediumMatches])
      }
    } catch (error) {
      console.error("Error generating AI suggestions:", error)
      toast({
        title: "AI Matching Failed",
        description: "We couldn't generate personalized recommendations. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const generateProfileRecommendations = async () => {
    setIsGeneratingRecommendations(true)
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_insights',
          profile: artistProfile
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate profile insights')
      }
      
      const data = await response.json()
      
      if (data.insights) {
        setProfileRecommendations({
          strengths: data.insights.strengths || [],
          improvements: data.insights.improvements || [],
          opportunityTypes: data.insights.opportunityTypes || []
        })
      }
    } catch (error) {
      console.error("Error generating profile recommendations:", error)
      toast({
        title: "AI Analysis Failed",
        description: "We couldn't analyze your profile. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingRecommendations(false)
    }
  }

  const saveProfile = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your profile.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          artistic_discipline: artistProfile.artistic_discipline,
          experience_level: artistProfile.experience_level,
          skills: artistProfile.skills,
          interests: artistProfile.interests,
          location: artistProfile.location
        })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Update Failed",
        description: "We couldn't save your profile. Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getInterestsArray = () => {
    return artistProfile.interests
      ? artistProfile.interests.split(',').map(i => i.trim()).filter(Boolean)
      : []
  }
  
  const getSkillsArray = () => {
    return artistProfile.skills
      ? artistProfile.skills.split(',').map(s => s.trim()).filter(Boolean)
      : []
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            Search Opportunities
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search for Opportunities</CardTitle>
              <CardDescription>
                Find grants, jobs, and gigs that match your interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for grants, jobs, or gigs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              {searchResults.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>No results found</AlertTitle>
              <AlertDescription>
                Try different keywords or check out our AI recommendations.
              </AlertDescription>
            </Alert>
          ) : null}
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Artist Profile</CardTitle>
              <CardDescription>
                Update your profile to get better AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Artistic Discipline</label>
                      <Select 
                        value={artistProfile.artistic_discipline || ""} 
                        onValueChange={(value) => setArtistProfile({...artistProfile, artistic_discipline: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select discipline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual_arts">Visual Arts</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="performing_arts">Performing Arts</SelectItem>
                          <SelectItem value="literature">Literature</SelectItem>
                          <SelectItem value="film">Film & Video</SelectItem>
                          <SelectItem value="digital_media">Digital Media</SelectItem>
                          <SelectItem value="mixed_media">Mixed Media</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experience Level</label>
                      <Select 
                        value={artistProfile.experience_level || ""} 
                        onValueChange={(value) => setArtistProfile({...artistProfile, experience_level: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emerging">Emerging (0-3 years)</SelectItem>
                          <SelectItem value="mid_career">Mid-Career (3-10 years)</SelectItem>
                          <SelectItem value="established">Established (10+ years)</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input 
                        placeholder="City, State/Province, Country" 
                        value={artistProfile.location || ""} 
                        onChange={(e) => setArtistProfile({...artistProfile, location: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getSkillsArray().map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add a skill" 
                        value={newSkill} 
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSkill()
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={handleAddSkill}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interests</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getInterestsArray().map((interest, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {interest}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveInterest(interest)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add an interest" 
                        value={newInterest} 
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddInterest()
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={handleAddInterest}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={saveProfile}
                    >
                      Save Profile
                    </Button>
                    <Button 
                      type="button" 
                      onClick={generateAiSuggestions}
                      disabled={isGeneratingSuggestions}
                    >
                      {isGeneratingSuggestions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finding Matches...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Find Matching Opportunities
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {aiSuggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI-Recommended Opportunities</h3>
              {aiSuggestions.map((opportunity) => (
                <OpportunityCard 
                  key={opportunity.id} 
                  opportunity={opportunity} 
                  showMatchScore={true}
                />
              ))}
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>AI Profile Analysis</CardTitle>
              <CardDescription>
                Get personalized recommendations to improve your grant success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateProfileRecommendations}
                disabled={isGeneratingRecommendations}
                className="w-full"
              >
                {isGeneratingRecommendations ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Analyze My Profile
                  </>
                )}
              </Button>
              
              {profileRecommendations && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Profile Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {profileRecommendations.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {profileRecommendations.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Recommended Opportunity Types</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {profileRecommendations.opportunityTypes.map((type, index) => (
                        <li key={index}>{type}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 