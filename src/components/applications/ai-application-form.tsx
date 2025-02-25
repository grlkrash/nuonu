'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication } from '@/lib/services/applications'
import { getProfileById } from '@/lib/services/profiles'
import { getOpportunityById } from '@/lib/services/opportunities'
import { generateApplicationContent } from '@/lib/services/openai'

interface AIApplicationFormProps {
  opportunityId: string
  userId: string
}

export function AIApplicationForm({ opportunityId, userId }: AIApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [opportunity, setOpportunity] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    message: '',
    proposal: '',
    compensation: ''
  })
  
  // Load profile and opportunity data
  useEffect(() => {
    const loadData = async () => {
      try {
        const profileData = await getProfileById(userId)
        setProfile(profileData)
        
        const opportunityData = await getOpportunityById(opportunityId)
        setOpportunity(opportunityData)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load profile or opportunity data')
      }
    }
    
    loadData()
  }, [userId, opportunityId])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleGenerateContent = async () => {
    if (!profile || !opportunity) {
      setError('Profile or opportunity data not available')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const content = await generateApplicationContent(profile, opportunity)
      
      setFormData(prev => ({
        ...prev,
        message: content.message,
        proposal: content.proposal
      }))
    } catch (err) {
      console.error('Error generating content:', err)
      setError('Failed to generate application content')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await createApplication({
        user_id: userId,
        opportunity_id: opportunityId,
        message: formData.message,
        proposal: formData.proposal,
        compensation: formData.compensation || undefined
      })
      
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error('Error submitting application:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
          Application Submitted Successfully!
        </h3>
        <p className="text-green-700 dark:text-green-400 mb-4">
          Your application has been submitted. You can track its status in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <button
            onClick={() => {
              setSuccess(false)
              setFormData({
                message: '',
                proposal: '',
                compensation: ''
              })
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Submit Another Application
          </button>
          <button
            onClick={() => router.push('/dashboard/applications')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
          >
            View My Applications
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerateContent}
          disabled={isGenerating || !profile || !opportunity}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate with AI
            </>
          )}
        </button>
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Introduction Message <span className="text-red-600">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
          placeholder="Briefly introduce yourself and explain why you're interested in this opportunity"
          required
        />
      </div>
      
      <div>
        <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Proposal <span className="text-red-600">*</span>
        </label>
        <textarea
          id="proposal"
          name="proposal"
          value={formData.proposal}
          onChange={handleChange}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
          placeholder="Describe your approach, relevant experience, and how you would fulfill the requirements"
          required
        />
      </div>
      
      <div>
        <label htmlFor="compensation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Compensation Request
        </label>
        <input
          type="text"
          id="compensation"
          name="compensation"
          value={formData.compensation}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
          placeholder="Optional: Specify your compensation requirements"
        />
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  )
} 