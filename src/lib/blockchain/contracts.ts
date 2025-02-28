import { ethers } from 'ethers'
import { Provider, Contract } from 'zksync-web3'
import { walletAbstraction } from './wallet-abstraction'

// ABI for ArtistFundManager contract
const ArtistFundManagerABI = [
  "function submitApplication(string applicationId, string contentHash, string grantId) external",
  "function awardGrant(string grantId, string artistId) external",
  "function distributeFunds(string artistId) external",
  "function getApplication(string applicationId) external view returns (tuple(string id, string contentHash, address artistAddress, string grantId, uint8 status, uint256 timestamp))",
  "event ApplicationSubmitted(string indexed applicationId, string indexed grantId, address indexed artist)",
  "event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount)"
]

// Contract addresses
export const CONTRACT_ADDRESSES = {
  base: {
    testnet: process.env.NEXT_PUBLIC_BASE_CONTRACT_ADDRESS || '',
    mainnet: process.env.NEXT_PUBLIC_BASE_MAINNET_CONTRACT_ADDRESS || ''
  },
  zksync: {
    testnet: process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS || '',
    mainnet: process.env.NEXT_PUBLIC_ZKSYNC_MAINNET_CONTRACT_ADDRESS || ''
  }
}

// Interface for application data
export interface OnChainApplication {
  id: string
  contentHash: string
  artistAddress: string
  grantId: string
  status: number
  timestamp: number
}

// Contract wrapper class
export class ContractManager {
  private baseContract: ethers.Contract | null = null
  private zkSyncContract: Contract | null = null

  // Initialize Base contract
  async initializeBaseContract() {
    const wallet = walletAbstraction.getState().baseWallet
    if (!wallet) throw new Error('Base wallet not connected')

    const address = CONTRACT_ADDRESSES.base.testnet
    if (!address) throw new Error('Base contract address not configured')

    this.baseContract = new ethers.Contract(
      address,
      ArtistFundManagerABI,
      wallet.signer
    )

    return this.baseContract
  }

  // Initialize zkSync contract
  async initializeZkSyncContract() {
    const wallet = walletAbstraction.getState().zkSyncWallet
    if (!wallet) throw new Error('zkSync wallet not connected')

    const address = CONTRACT_ADDRESSES.zksync.testnet
    if (!address) throw new Error('zkSync contract address not configured')

    this.zkSyncContract = new Contract(
      address,
      ArtistFundManagerABI,
      wallet.signer
    )

    return this.zkSyncContract
  }

  // Submit application to Base contract
  async submitApplicationToBase(
    applicationId: string,
    contentHash: string,
    grantId: string
  ) {
    if (!this.baseContract) {
      await this.initializeBaseContract()
    }

    try {
      const tx = await this.baseContract!.submitApplication(
        applicationId,
        contentHash,
        grantId
      )
      const receipt = await tx.wait()
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Error submitting application to Base:', error)
      throw error
    }
  }

  // Submit application to zkSync
  async submitApplicationToZkSync(
    applicationId: string,
    contentHash: string,
    grantId: string
  ) {
    if (!this.zkSyncContract) {
      await this.initializeZkSyncContract()
    }

    try {
      const tx = await this.zkSyncContract!.submitApplication(
        applicationId,
        contentHash,
        grantId
      )
      const receipt = await tx.wait()
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      }
    } catch (error) {
      console.error('Error submitting application to zkSync:', error)
      throw error
    }
  }

  // Get application from Base
  async getApplicationFromBase(applicationId: string): Promise<OnChainApplication> {
    if (!this.baseContract) {
      await this.initializeBaseContract()
    }

    const application = await this.baseContract!.getApplication(applicationId)
    return this.parseApplication(application)
  }

  // Get application from zkSync
  async getApplicationFromZkSync(applicationId: string): Promise<OnChainApplication> {
    if (!this.zkSyncContract) {
      await this.initializeZkSyncContract()
    }

    const application = await this.zkSyncContract!.getApplication(applicationId)
    return this.parseApplication(application)
  }

  // Helper to parse application data
  private parseApplication(data: any): OnChainApplication {
    return {
      id: data.id,
      contentHash: data.contentHash,
      artistAddress: data.artistAddress,
      grantId: data.grantId,
      status: data.status,
      timestamp: data.timestamp.toNumber()
    }
  }
}

// Create singleton instance
export const contractManager = new ContractManager() 