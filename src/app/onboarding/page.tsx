'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { SimpleWalletConnect } from '@/components/blockchain/simple-wallet-connect'
import { PortfolioUpload } from '@/components/profile/portfolio-upload'
import { Loader2, Upload, ArrowRight, ArrowLeft, Check } from 'lucide-react'

const STEPS = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Tell us about yourself'
  },
  {
    id: 'professional',
    title: 'Professional Profile',
    description: 'Share your professional background'
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Upload your work samples'
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Set up your wallet to receive payments'
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'Your profile is ready to go'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: '',
    location: '',
    fields: '',
    skills_experience: '',
    bio: '',
    resume_url: '',
    portfolio_files: [] as any[]
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const file = e.target.files[0]
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      if (!event.target?.result) return
      
      try {
        // Upload to Supabase Storage
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        const filePath = `resumes/${user.id}/${Date.now()}_${file.name}`
        
        const { error } = await supabase.storage
          .from('profiles')
          .upload(filePath, file)
          
        if (error) throw error
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath)
          
        setFormData(prev => ({ ...prev, resume_url: publicUrl }))
        
        toast({
          title: 'Resume uploaded',
          description: 'Your resume has been uploaded successfully.',
          variant: 'default'
        })
      } catch (error) {
        console.error('Error uploading resume:', error)
        toast({
          title: 'Upload failed',
          description: 'There was an error uploading your resume. Please try again.',
          variant: 'destructive'
        })
      }
    }
    
    reader.readAsDataURL(file)
  }

  const handlePortfolioUpload = (files: any[]) => {
    setFormData(prev => ({ ...prev, portfolio_files: [...prev.portfolio_files, ...files] }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          age: parseInt(formData.age) || null,
          location: formData.location,
          fields: formData.fields.split(',').map(field => field.trim()),
          skills_experience: formData.skills_experience,
          bio: formData.bio,
          resume_url: formData.resume_url,
          portfolio_files: formData.portfolio_files,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      // Show success message
      toast({
        title: 'Profile created!',
        description: 'Your artist profile has been set up successfully.',
        variant: 'default'
      })
      
      // Move to final step
      setCurrentStep(STEPS.length - 1)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">What is your name?</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">What's your email?</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">How old are you?</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Your age"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Where are you from?</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleNext} className="flex items-center">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )
        
      case 1: // Professional Profile
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fields">What field do you work in? (list all applicable, separated by commas)</Label>
                <Input
                  id="fields"
                  name="fields"
                  value={formData.fields}
                  onChange={handleInputChange}
                  placeholder="Visual Arts, Music, Photography, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills_experience">What are your relevant skills and experience?</Label>
                <Textarea
                  id="skills_experience"
                  name="skills_experience"
                  value={formData.skills_experience}
                  onChange={handleInputChange}
                  placeholder="List your skills and experience"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Share as much information about yourself as you can. (if you have old bios, you can paste them here)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself, your work, your interests, etc."
                  rows={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resume">Please share a resume or CV if available. (not required)</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.resume_url ? 'Change Resume' : 'Upload Resume'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="resume"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </div>
                {formData.resume_url && (
                  <p className="text-sm text-green-600 mt-1">Resume uploaded successfully</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex items-center">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )
        
      case 2: // Portfolio
        return (
          <>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload samples of your work to showcase your skills and experience. This will help you stand out when applying for opportunities.
              </p>
              
              <div className="mt-4">
                {async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  return user ? (
                    <PortfolioUpload 
                      userId={user.id} 
                      onUploadComplete={handlePortfolioUpload} 
                    />
                  ) : null
                }}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="flex items-center">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )
        
      case 3: // Connect Wallet
        return (
          <>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect your wallet to receive payments for opportunities. You can connect to multiple blockchains for maximum flexibility.
              </p>
              
              <div className="mt-4">
                <SimpleWalletConnect />
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Profile
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )
        
      case 4: // Complete
        return (
          <>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold">Profile Complete!</h3>
              
              <p className="text-gray-600 dark:text-gray-300">
                Your artist profile is now set up. You can start discovering and applying for opportunities.
              </p>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button onClick={handleComplete}>Go to Dashboard</Button>
            </div>
          </>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Artist Onboarding</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Set up your profile to get personalized opportunities
        </p>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${index > currentStep ? 'text-gray-400' : ''}`}
            >
              <div 
                className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep 
                    ? 'bg-green-600 text-white' 
                    : index === currentStep 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  )
} 