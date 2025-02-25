import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { getOpportunityById } from '@/services/opportunities'

interface OpportunityPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: OpportunityPageProps) {
  const opportunity = await getOpportunityById(params.id).catch(() => null)
  
  if (!opportunity) {
    return {
      title: 'Opportunity Not Found | Nuonu',
      description: 'The requested opportunity could not be found',
    }
  }
  
  return {
    title: `${opportunity.title} | Nuonu`,
    description: opportunity.description?.slice(0, 160) || 'View opportunity details',
  }
}

async function OpportunityContent({ id }: { id: string }) {
  const opportunity = await getOpportunityById(id).catch(() => null)
  
  if (!opportunity) {
    notFound()
  }
  
  const formattedDeadline = opportunity.deadline 
    ? format(new Date(opportunity.deadline), 'MMMM d, yyyy')
    : 'No deadline specified'
  
  const formattedAmount = opportunity.amount 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.amount)
    : 'Amount not specified'
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {opportunity.title}
            </h1>
            
            {opportunity.organization && (
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {opportunity.organization}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {opportunity.opportunity_type}
            </span>
            
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">Deadline:</span> {formattedDeadline}
            </p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {opportunity.description || 'No description provided'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Details
            </h2>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formattedAmount}</span>
              </li>
              
              {opportunity.eligibility && (
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Eligibility:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{opportunity.eligibility}</span>
                </li>
              )}
              
              {opportunity.platform && (
                <li className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{opportunity.platform}</span>
                </li>
              )}
            </ul>
          </div>
          
          {opportunity.contract_address && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Blockchain Details
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Contract Address:</p>
                <p className="font-mono text-sm break-all">{opportunity.contract_address}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href="/opportunities"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to opportunities
          </Link>
          
          {opportunity.application_url && (
            <a 
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Apply Now
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OpportunityPage({ params }: OpportunityPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<OpportunityLoading />}>
        <OpportunityContent id={params.id} />
      </Suspense>
    </div>
  )
}

function OpportunityLoading() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
          </div>
        </div>
        
        <div className="mb-8 space-y-2">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
} 