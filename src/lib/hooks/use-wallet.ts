"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"

interface WalletState {
  address: string | null
  isConnected: boolean
  chainId: string | null
  balance: string | null
  provider: any | null
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    balance: null,
    provider: null
  })

  // Initialize wallet from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress")
    if (savedAddress) {
      connect()
    }
  }, [])

  // Connect wallet
  const connect = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask or another Ethereum wallet")
      return
    }

    try {
      // Request account access
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      // Save state
      setWalletState({
        address,
        isConnected: true,
        chainId: network.chainId.toString(),
        balance: ethers.utils.formatEther(balance),
        provider
      })

      // Save to localStorage
      localStorage.setItem("walletAddress", address)

      // Setup event listeners
      setupEventListeners()

      return address
    } catch (error) {
      console.error("Error connecting wallet:", error)
      return null
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState({
      address: null,
      isConnected: false,
      chainId: null,
      balance: null,
      provider: null
    })
    localStorage.removeItem("walletAddress")
  }, [])

  // Setup event listeners for wallet changes
  const setupEventListeners = useCallback(() => {
    if (typeof window.ethereum === "undefined") return

    // Handle account changes
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect()
      } else {
        // User switched accounts
        connect()
      }
    })

    // Handle chain changes
    window.ethereum.on("chainChanged", () => {
      // Refresh when chain changes
      connect()
    })

    // Handle disconnect
    window.ethereum.on("disconnect", () => {
      disconnect()
    })
  }, [connect, disconnect])

  // Switch network
  const switchNetwork = useCallback(async (chainId: string) => {
    if (!walletState.provider) return false

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }]
      })
      return true
    } catch (error) {
      console.error("Error switching network:", error)
      return false
    }
  }, [walletState.provider])

  // Get signer
  const getSigner = useCallback(async () => {
    if (!walletState.provider) return null

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      return provider.getSigner()
    } catch (error) {
      console.error("Error getting signer:", error)
      return null
    }
  }, [walletState.provider])

  return {
    address: walletState.address,
    isConnected: walletState.isConnected,
    chainId: walletState.chainId,
    balance: walletState.balance,
    connect,
    disconnect,
    switchNetwork,
    getSigner
  }
} 