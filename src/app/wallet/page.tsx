import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { MultiChainWallet } from '@/components/blockchain/multi-chain-wallet'

export const metadata = {
  title: 'Multi-Chain Wallet | Nuonu',
  description: 'Connect your crypto wallets to receive payments for opportunities across multiple blockchains',
}

export default async function WalletPage() {
  const user = await getCurrentUser().catch(() => null)
  
  if (!user) {
    redirect('/signin?redirect=/wallet')
  }
  
  const profile = await getProfileById(user.id).catch(() => null)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Multi-Chain Wallet</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Connect your crypto wallets to receive payments for opportunities across multiple blockchains
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                This page is being deprecated. Please use the wallet connection component on the dashboard page instead.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <MultiChainWallet userId={user.id} />
            
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">About Blockchain Integration</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  Our platform uses blockchain technology to facilitate secure and transparent payments for artists. 
                  We support multiple blockchain networks to provide you with flexibility and options:
                </p>
                
                <ul>
                  <li>
                    <strong>Base (Coinbase L2)</strong> - Our primary network for fast and low-cost transactions
                  </li>
                  <li>
                    <strong>zkSync Era</strong> - For improved transaction efficiency and onboarding
                  </li>
                  <li>
                    <strong>Flow blockchain</strong> - With Eliza OS integration for enhanced AI capabilities
                  </li>
                </ul>
                
                <p>
                  By connecting your wallets, you'll be able to:
                </p>
                
                <ul>
                  <li>Receive payments directly to your wallet on your preferred blockchain</li>
                  <li>Track all transactions on the blockchain</li>
                  <li>Maintain full control of your funds</li>
                  <li>Choose the most cost-effective network for your needs</li>
                </ul>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> We never have access to your private keys or funds. All transactions are 
                    conducted directly between you and the opportunity provider through smart contracts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 