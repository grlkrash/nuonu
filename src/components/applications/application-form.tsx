'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication } from '@/lib/services/applications'

interface ApplicationFormProps {
  opportunityId: string
}

export function ApplicationForm({ opportunityId }: ApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    message: '',
    proposal: '',
    compensation: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await createApplication({
        opportunity_id: opportunityId,
        message: formData.message,
        proposal: formData.proposal,
        compensation: formData.compensation,
        status: 'pending'
      })
      
      setSuccess(true)
      setFormData({
        message: '',
        proposal: '',
        compensation: '',
      })
      
      // Refresh the page data
      router.refresh()
    } catch (err) {
      console.error('Error submitting application:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">Application Submitted!</h3>
        <p className="text-green-700 dark:text-green-300 mb-4">
          Your application has been successfully submitted. You can track its status in your dashboard.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => setSuccess(false)}
            className="px-4 py-2 bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={() => router.push('/dashboard/applications')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            View My Applications
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} id="apply" className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Introduction Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          placeholder="Introduce yourself and explain why you're interested in this opportunity"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={4}
        />
      </div>
      
      <div>
        <label htmlFor="proposal" className="block text-sm font-medium mb-2">
          Proposal <span className="text-red-500">*</span>
        </label>
        <textarea
          id="proposal"
          name="proposal"
          value={formData.proposal}
          onChange={handleChange}
          required
          placeholder="Describe your approach, timeline, and how you plan to deliver results"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={6}
        />
      </div>
      
      <div>
        <label htmlFor="compensation" className="block text-sm font-medium mb-2">
          Compensation Request
        </label>
        <input
          type="text"
          id="compensation"
          name="compensation"
          value={formData.compensation}
          onChange={handleChange}
          placeholder="Your requested compensation (optional)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  )
} 