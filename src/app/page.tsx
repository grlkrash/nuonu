import Link from 'next/link'
import { getOpportunities } from '@/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export default async function Home() {
  // Get a few recent opportunities to display
  const recentOpportunities = await getOpportunities({ limit: 3 })
  
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Funding for Your Art with AI
            </h1>
            <p className="text-xl mb-8">
              Nuonu helps artists discover and apply for grants, residencies, and other funding opportunities using AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/opportunities"
                className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Browse Opportunities
              </Link>
              <Link 
                href="/profile"
                className="px-6 py-3 bg-blue-700 text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
              >
                Create Profile
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Nuonu Helps Artists
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Opportunities</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Find grants, residencies, and other funding opportunities tailored to your artistic practice.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Applications</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep track of your applications, deadlines, and responses all in one place.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Assistance</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized recommendations and assistance with application materials.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Recent opportunities section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              Recent Opportunities
            </h2>
            <Link 
              href="/opportunities"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentOpportunities.map(opportunity => (
              <OpportunityCard 
                key={opportunity.id} 
                opportunity={opportunity} 
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Find Funding for Your Art?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Create your profile today and start discovering opportunities tailored to your artistic practice.
          </p>
          <Link 
            href="/profile"
            className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  )
} 