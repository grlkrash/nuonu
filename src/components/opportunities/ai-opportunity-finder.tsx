"use client"

import { useState } from "react"
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

// Mock data for AI-suggested opportunities
const mockOpportunities = [
  {
    id: "ai-1",
    title: "Emerging Artist Grant Program",
    description: "A grant program specifically designed for emerging artists working in digital media. Provides funding for new projects and professional development.",
    opportunity_type: "grant",
    organization: "Digital Arts Foundation",
    amount: 5000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    eligibility: "Artists with less than 5 years professional experience",
    application_url: "https://example.com/apply",
    source: "AI Recommendation",
    source_id: "ai-rec-1",
    created_at: new Date().toISOString(),
    status: "open",
    category: "Digital Media",
    is_remote: true,
    location: null,
    profiles: null
  },
  {
    id: "ai-2",
    title: "Music Production Residency",
    description: "A 3-month residency program for music producers looking to collaborate with other artists and develop new work.",
    opportunity_type: "grant",
    organization: "Sound Collective",
    amount: 7500,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    eligibility: "Music producers with portfolio of work",
    application_url: "https://example.com/apply",
    source: "AI Recommendation",
    source_id: "ai-rec-2",
    created_at: new Date().toISOString(),
    status: "open",
    category: "Music",
    is_remote: false,
    location: "New York, NY",
    profiles: null
  },
  {
    id: "ai-3",
    title: "Album Artwork Designer",
    description: "Freelance opportunity to design album artwork for an upcoming indie rock release. Looking for bold, distinctive visual style.",
    opportunity_type: "gig",
    organization: "Indie Label XYZ",
    amount: 1200,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    eligibility: "Graphic designers with portfolio",
    application_url: "https://example.com/apply",
    source: "AI Recommendation",
    source_id: "ai-rec-3",
    created_at: new Date().toISOString(),
    status: "open",
    category: "Design",
    is_remote: true,
    location: null,
    profiles: null
  }
]

interface ArtistProfile {
  medium: string
  experience: string
  interests: string[]
  skills: string[]
  location: string
}

export function AIOpportunityFinder() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [artistProfile, setArtistProfile] = useState<ArtistProfile>({
    medium: "",
    experience: "",
    interests: [],
    skills: [],
    location: ""
  })
  const [newInterest, setNewInterest] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    setSearchResults([])
    
    try {
      // In a real implementation, this would call an AI-powered search API
      // For now, we'll simulate a response with mock data
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Filter mock opportunities based on search query
      const results = mockOpportunities.filter(opp => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching opportunities:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddInterest = () => {
    if (newInterest && !artistProfile.interests.includes(newInterest)) {
      setArtistProfile({
        ...artistProfile,
        interests: [...artistProfile.interests, newInterest]
      })
      setNewInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setArtistProfile({
      ...artistProfile,
      interests: artistProfile.interests.filter(i => i !== interest)
    })
  }

  const handleAddSkill = () => {
    if (newSkill && !artistProfile.skills.includes(newSkill)) {
      setArtistProfile({
        ...artistProfile,
        skills: [...artistProfile.skills, newSkill]
      })
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setArtistProfile({
      ...artistProfile,
      skills: artistProfile.skills.filter(s => s !== skill)
    })
  }

  const generateAiSuggestions = async () => {
    setIsGeneratingSuggestions(true)
    setAiSuggestions([])
    
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate a response with mock data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Filter opportunities based on artist profile
      let suggestions = [...mockOpportunities]
      
      if (artistProfile.medium) {
        suggestions = suggestions.filter(opp => 
          opp.category?.toLowerCase().includes(artistProfile.medium.toLowerCase())
        )
      }
      
      if (artistProfile.interests.length > 0) {
        suggestions = suggestions.filter(opp => 
          artistProfile.interests.some(interest => 
            opp.title.toLowerCase().includes(interest.toLowerCase()) ||
            opp.description.toLowerCase().includes(interest.toLowerCase()) ||
            opp.category?.toLowerCase().includes(interest.toLowerCase())
          )
        )
      }
      
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error("Error generating AI suggestions:", error)
    } finally {
      setIsGeneratingSuggestions(false)
    }
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
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setSearchQuery("music grant")}>
                    Music Grant
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setSearchQuery("digital art")}>
                    Digital Art
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setSearchQuery("residency")}>
                    Residency
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100" onClick={() => setSearchQuery("remote")}>
                    Remote
                  </Badge>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {isSearching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>No results found</AlertTitle>
              <AlertDescription>
                Try different keywords or use the AI Recommendations tab to get personalized suggestions.
              </AlertDescription>
            </Alert>
          ) : null}
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Artist Profile</CardTitle>
              <CardDescription>
                Tell us about your art to get personalized opportunity recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Medium/Discipline</label>
                <Select
                  value={artistProfile.medium}
                  onValueChange={(value) => setArtistProfile({ ...artistProfile, medium: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary medium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="visual art">Visual Art</SelectItem>
                    <SelectItem value="digital media">Digital Media</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="film">Film</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select
                  value={artistProfile.experience}
                  onValueChange={(value) => setArtistProfile({ ...artistProfile, experience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging">Emerging (0-3 years)</SelectItem>
                    <SelectItem value="mid-career">Mid-Career (3-10 years)</SelectItem>
                    <SelectItem value="established">Established (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Interests</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddInterest}>
                    Add
                  </Button>
                </div>
                {artistProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {artistProfile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                        {interest}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveInterest(interest)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Skills</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddSkill}>
                    Add
                  </Button>
                </div>
                {artistProfile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {artistProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="City, State/Province, Country"
                  value={artistProfile.location}
                  onChange={(e) => setArtistProfile({ ...artistProfile, location: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateAiSuggestions} 
                disabled={isGeneratingSuggestions || !artistProfile.medium}
                className="w-full"
              >
                {isGeneratingSuggestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Recommendations
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {isGeneratingSuggestions ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Personalized Recommendations</h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  AI-Powered
                </Badge>
              </div>
              
              <Alert className="bg-purple-50 border-purple-200">
                <Lightbulb className="h-4 w-4 text-purple-500" />
                <AlertTitle className="text-purple-800">Why these recommendations?</AlertTitle>
                <AlertDescription className="text-purple-700">
                  Based on your profile as a {artistProfile.experience} {artistProfile.medium} artist
                  {artistProfile.interests.length > 0 && ` with interests in ${artistProfile.interests.join(', ')}`}.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {aiSuggestions.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
} 