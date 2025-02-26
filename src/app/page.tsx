import Link from 'next/link'
import { getOpportunities } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Nuonu - AI-Powered Opportunity Discovery for Artists',
  description: 'Discover and apply for grants, jobs, and creative opportunities tailored to your artistic profile',
}

export default async function HomePage() {
  // Get featured opportunities
  const { opportunities } = await getOpportunities({
    limit: 3,
    status: 'open',
    sortBy: 'created_at',
    sortOrder: 'desc',
  }).catch(() => ({ opportunities: [], count: 0 }))
  
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          AI-Powered Grant Discovery for Artists
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Discover grants, jobs, and creative opportunities tailored to your artistic profile. 
          Let AI match you with the perfect opportunities and apply with ease.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-medium rounded-md transition-colors text-center"
          >
            Get Started
          </Link>
          <Link
            href="/opportunities"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-md transition-colors text-center border border-white"
          >
            Browse Opportunities
          </Link>
        </div>
      </div>
      
      {/* Features section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-gray-900 rounded-lg shadow p-6 text-center border border-gray-800">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-3 text-white">Discover Opportunities</h2>
          <p className="text-gray-300">
            Browse through a curated list of grants, jobs, and creative opportunities for artists.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow p-6 text-center border border-gray-800">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-3 text-white">AI-Powered Applications</h2>
          <p className="text-gray-300">
            Let our AI generate personalized applications based on your profile and the opportunity requirements.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg shadow p-6 text-center border border-gray-800">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-3 text-white">Blockchain Payments</h2>
          <p className="text-gray-300">
            Receive grant funds directly to your wallet through secure blockchain transactions.
          </p>
        </div>
      </div>
      
      {/* Featured opportunities */}
      {opportunities.length > 0 && (
        <div className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Featured Opportunities</h2>
            <Link
              href="/opportunities"
              className="text-white hover:underline"
            >
              View all opportunities
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      )}
      
      {/* CTA section */}
      <div className="bg-gray-900 rounded-lg shadow p-8 text-center text-white border border-gray-800">
        <h2 className="text-2xl font-bold mb-4">Ready to find your next opportunity?</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Create your artist profile today and let our AI match you with the perfect opportunities.
        </p>
        <Link
          href="/onboarding"
          className="inline-block px-6 py-3 bg-white text-black font-medium rounded-md transition-colors hover:bg-gray-200"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
} 