import Link from 'next/link'

export default function OpportunityNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Opportunity Not Found
      </h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
        The opportunity you're looking for doesn't exist or has been removed.
      </p>
      <Link 
        href="/opportunities"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors inline-block"
      >
        Browse Opportunities
      </Link>
    </div>
  )
} 