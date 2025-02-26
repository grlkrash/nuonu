import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { getOpportunities } from '@/lib/services/opportunities'
import { OpportunityCard } from '@/components/opportunities/opportunity-card'

export const metadata = {
  title: 'Blockchain Opportunities | Nuonu',
  description: 'Discover artist opportunities with blockchain integration',
}

export default async function BlockchainOpportunitiesPage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/discover/blockchain')
  }
  
  // Get user profile for personalization
  const profile = await getProfileById(user.id).catch(() => null)
  
  // Get blockchain-related opportunities
  // In a real implementation, this would filter for blockchain-specific opportunities
  const blockchainOpportunities = await getOpportunities({ 
    limit: 10,
    tags: ['blockchain', 'crypto', 'web3', 'nft']
  }).catch(() => [])
  
  // Blockchain networks we support
  const blockchainNetworks = [
    {
      id: 'base',
      name: 'Base',
      description: 'Ethereum L2 by Coinbase',
      icon: (
        <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="currentColor"/>
        </svg>
      ),
      color: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      id: 'zksync',
      name: 'zkSync Era',
      description: 'Zero-knowledge rollup with session keys',
      icon: (
        <svg className="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    {
      id: 'flow',
      name: 'Flow',
      description: 'Developer-friendly blockchain for NFTs',
      icon: (
        <svg className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 14.5C7 13.1193 8.11929 12 9.5 12H14.5C15.8807 12 17 10.8807 17 9.5C17 8.11929 15.8807 7 14.5 7H9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9.5 17C8.11929 17 7 15.8807 7 14.5C7 13.1193 8.11929 12 9.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
    },
    {
      id: 'chainlink',
      name: 'Chainlink CCIP',
      description: 'Cross-chain interoperability protocol',
      icon: (
        <svg className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 8V16L12 20L20 16V8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 12L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Blockchain Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover artist opportunities with blockchain integration
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/discover"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Discover
          </Link>
        </div>
      </div>
      
      {/* Blockchain networks */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Supported Blockchain Networks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blockchainNetworks.map(network => (
            <div
              key={network.id}
              className={`p-4 ${network.color} border ${network.borderColor} rounded-lg`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {network.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">{network.name}</h3>
                  <p className={`mt-1 ${network.textColor}`}>
                    {network.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Connect wallet CTA */}
      <div className="mb-12 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 md:mb-0">
              Connect your blockchain wallet to apply for opportunities and receive payments directly.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/wallet"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </div>
      
      {/* Blockchain opportunities */}
      {blockchainOpportunities.length > 0 ? (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Blockchain Opportunities</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Opportunities that utilize blockchain technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockchainOpportunities.map(opportunity => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No blockchain opportunities found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There are currently no blockchain-related opportunities available. Check back later or browse all opportunities.
          </p>
          <Link
            href="/opportunities"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Browse All Opportunities
          </Link>
        </div>
      )}
      
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300">
              About Blockchain Opportunities
            </h3>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-400">
              <p>
                Blockchain opportunities offer artists new ways to monetize their work, receive secure payments, 
                and engage with decentralized communities. These opportunities often include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>NFT creation and sales</li>
                <li>DAO-funded grants and commissions</li>
                <li>Web3 project collaborations</li>
                <li>Crypto-native creative platforms</li>
                <li>Decentralized creator economies</li>
              </ul>
              <p className="mt-2">
                By connecting your wallet, you can apply for these opportunities and receive payments directly, 
                without intermediaries taking a cut of your earnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 