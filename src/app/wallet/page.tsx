import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getProfileById } from '@/lib/services/profiles'
import { WalletConnect } from '@/components/blockchain/wallet-connect'
import { WalletManager } from '@/components/blockchain/wallet-manager'

export const metadata = {
  title: 'Wallet | Nuonu',
  description: 'Connect your crypto wallet to receive payments for opportunities',
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
          <h1 className="text-2xl md:text-3xl font-bold">Your Wallet</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Connect your crypto wallet to receive payments for opportunities
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Connect your Ethereum wallet to receive payments for opportunities. We support MetaMask and other Ethereum-compatible wallets.
              </p>
              
              <WalletConnect />
            </div>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Wallet Management</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage your connected wallet and view your transaction history.
              </p>
              
              <WalletManager userId={user.id} />
            </div>
            
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">About Blockchain Integration</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  Our platform uses blockchain technology to facilitate secure and transparent payments for artists. 
                  We currently support the following networks:
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
                  By connecting your wallet, you'll be able to:
                </p>
                
                <ul>
                  <li>Receive payments directly to your wallet</li>
                  <li>Track all transactions on the blockchain</li>
                  <li>Maintain full control of your funds</li>
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