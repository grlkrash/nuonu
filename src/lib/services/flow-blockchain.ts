import * as fcl from '@onflow/fcl'
import * as t from '@onflow/types'

// Configure FCL
fcl.config({
  'accessNode.api': process.env.NEXT_PUBLIC_FLOW_ACCESS_API || 'https://rest-testnet.onflow.org',
  'discovery.wallet': process.env.NEXT_PUBLIC_FLOW_WALLET_API || 'https://fcl-discovery.onflow.org/testnet/authn',
  'app.detail.title': 'Nuonu Artist Platform',
  'app.detail.icon': 'https://nuonu.app/logo.png',
})

/**
 * Check if an artist is registered in the Flow contract
 */
export async function isArtistRegistered(artistId: string): Promise<boolean> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        pub fun main(artistId: String): Bool {
          return FlowArtistManager.isArtistRegistered(artistId: artistId)
        }
      `,
      args: (arg: any, t: any) => [arg(artistId, t.String)],
    })
    
    return result
  } catch (error) {
    console.error('Error checking if artist is registered:', error)
    return false
  }
}

/**
 * Register an artist in the Flow contract
 */
export async function registerArtist(artistId: string, address: string): Promise<{ txId: string }> {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        transaction(artistId: String, address: Address) {
          let adminRef: &FlowArtistManager.Admin
          
          prepare(signer: AuthAccount) {
            self.adminRef = signer.borrow<&FlowArtistManager.Admin>(from: /storage/FlowArtistManagerAdmin)
              ?? panic("Could not borrow admin reference")
          }
          
          execute {
            self.adminRef.registerArtist(artistId: artistId, address: address)
          }
        }
      `,
      args: (arg: any, t: any) => [
        arg(artistId, t.String),
        arg(address, t.Address),
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 100,
    })
    
    return { txId: transactionId }
  } catch (error) {
    console.error('Error registering artist:', error)
    throw new Error(`Failed to register artist: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Receive funds for an artist in the Flow contract
 */
export async function receiveFunds(opportunityId: string, artistId: string, amount: number): Promise<{ txId: string }> {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        transaction(opportunityId: String, artistId: String, amount: UFix64) {
          prepare(signer: AuthAccount) {
            // In a real implementation, this would transfer FLOW tokens
          }
          
          execute {
            FlowArtistManager.receiveFunds(
              opportunityId: opportunityId,
              artistId: artistId,
              amount: amount
            )
          }
        }
      `,
      args: (arg: any, t: any) => [
        arg(opportunityId, t.String),
        arg(artistId, t.String),
        arg(amount.toFixed(8), t.UFix64),
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 100,
    })
    
    return { txId: transactionId }
  } catch (error) {
    console.error('Error receiving funds:', error)
    throw new Error(`Failed to receive funds: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Distribute funds to an artist in the Flow contract
 */
export async function distributeFunds(artistId: string): Promise<{ txId: string }> {
  try {
    const transactionId = await fcl.mutate({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        transaction(artistId: String) {
          let adminRef: &FlowArtistManager.Admin
          
          prepare(signer: AuthAccount) {
            self.adminRef = signer.borrow<&FlowArtistManager.Admin>(from: /storage/FlowArtistManagerAdmin)
              ?? panic("Could not borrow admin reference")
          }
          
          execute {
            self.adminRef.distributeFunds(artistId: artistId)
          }
        }
      `,
      args: (arg: any, t: any) => [arg(artistId, t.String)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 100,
    })
    
    return { txId: transactionId }
  } catch (error) {
    console.error('Error distributing funds:', error)
    throw new Error(`Failed to distribute funds: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get pending funds for an artist in the Flow contract
 */
export async function getPendingFunds(artistId: string): Promise<number> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        pub fun main(artistId: String): UFix64 {
          return FlowArtistManager.getPendingFunds(artistId: artistId)
        }
      `,
      args: (arg: any, t: any) => [arg(artistId, t.String)],
    })
    
    return parseFloat(result)
  } catch (error) {
    console.error('Error getting pending funds:', error)
    return 0
  }
}

/**
 * Get total funds received by an artist in the Flow contract
 */
export async function getTotalFundsReceived(artistId: string): Promise<number> {
  try {
    const result = await fcl.query({
      cadence: `
        import FlowArtistManager from 0xFlowArtistManager
        
        pub fun main(artistId: String): UFix64 {
          return FlowArtistManager.getTotalFundsReceived(artistId: artistId)
        }
      `,
      args: (arg: any, t: any) => [arg(artistId, t.String)],
    })
    
    return parseFloat(result)
  } catch (error) {
    console.error('Error getting total funds received:', error)
    return 0
  }
} 