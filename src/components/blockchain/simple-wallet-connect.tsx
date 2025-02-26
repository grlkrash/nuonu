'use client'

import { useState } from 'react'
import { useWalletAbstraction } from '@/lib/blockchain/wallet-abstraction'

export function SimpleWalletConnect() {
  const {
    baseWallet,
    zkSyncWallet,
    flowWallet,
    isConnecting,
    error,
    connectBaseWallet,
    connectZkSyncWallet,
    createZkSyncSessionKey,
    connectFlowWallet,
    disconnectAll,
    isAnyWalletConnected
  } = useWalletAbstraction()

  const [activeTab, setActiveTab] = useState<'base' | 'zksync' | 'flow'>('base')
  const [sessionKeyCreated, setSessionKeyCreated] = useState(false)

  const handleConnectWallet = async () => {
    try {
      if (activeTab === 'base') {
        await connectBaseWallet()
      } else if (activeTab === 'zksync') {
        await connectZkSyncWallet()
      } else if (activeTab === 'flow') {
        await connectFlowWallet()
      }
    } catch (err) {
      console.error('Error connecting wallet:', err)
    }
  }

  const handleCreateSessionKey = async () => {
    try {
      await createZkSyncSessionKey()
      setSessionKeyCreated(true)
    } catch (err) {
      console.error('Error creating session key:', err)
    }
  }

  const renderWalletStatus = () => {
    if (activeTab === 'base' && baseWallet) {
      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Connected to Base
          </p>
          <p className="text-xs mt-1 text-green-700 dark:text-green-400">
            Address: {baseWallet.address.slice(0, 6)}...{baseWallet.address.slice(-4)}
          </p>
        </div>
      )
    }

    if (activeTab === 'zksync' && zkSyncWallet) {
      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Connected to zkSync
          </p>
          <p className="text-xs mt-1 text-green-700 dark:text-green-400">
            Address: {zkSyncWallet.address.slice(0, 6)}...{zkSyncWallet.address.slice(-4)}
          </p>
          {zkSyncWallet.sessionKey ? (
            <p className="text-xs mt-1 text-green-700 dark:text-green-400">
              Session Key: {zkSyncWallet.sessionKey.slice(0, 6)}...{zkSyncWallet.sessionKey.slice(-4)}
            </p>
          ) : (
            <button
              onClick={handleCreateSessionKey}
              disabled={isConnecting || sessionKeyCreated}
              className="mt-2 px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {sessionKeyCreated ? 'Session Key Created' : 'Create Session Key'}
            </button>
          )}
        </div>
      )
    }

    if (activeTab === 'flow' && flowWallet) {
      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Connected to Flow
          </p>
          <p className="text-xs mt-1 text-green-700 dark:text-green-400">
            Address: {flowWallet.address}
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Connect Your Wallet
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          onClick={() => setActiveTab('base')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'base'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Base
        </button>
        <button
          onClick={() => setActiveTab('zksync')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'zksync'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          zkSync
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'flow'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Flow
        </button>
      </div>

      {/* Connection Status */}
      {renderWalletStatus()}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Connect Button */}
      <div className="mt-4 flex space-x-2">
        {(activeTab === 'base' && !baseWallet) ||
        (activeTab === 'zksync' && !zkSyncWallet) ||
        (activeTab === 'flow' && !flowWallet) ? (
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : `Connect to ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          </button>
        ) : (
          <button
            onClick={disconnectAll}
            className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Disconnect All
          </button>
        )}
      </div>

      {/* Connected Wallets Summary */}
      {isAnyWalletConnected() && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connected Wallets
          </h3>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            {baseWallet && (
              <p>Base: {baseWallet.address.slice(0, 6)}...{baseWallet.address.slice(-4)}</p>
            )}
            {zkSyncWallet && (
              <p>zkSync: {zkSyncWallet.address.slice(0, 6)}...{zkSyncWallet.address.slice(-4)}</p>
            )}
            {flowWallet && (
              <p>Flow: {flowWallet.address}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 