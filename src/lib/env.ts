import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  
  // Blockchain - General
  NEXT_PUBLIC_NETWORK_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_RPC_URL: z.string().url().optional(),
  
  // Base
  NEXT_PUBLIC_BASE_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_CONTRACT_ADDRESS: z.string().optional(),
  
  // zkSync
  NEXT_PUBLIC_ZKSYNC_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ZKSYNC_NETWORK: z.string().optional(),
  
  // Flow
  NEXT_PUBLIC_FLOW_ACCESS_NODE: z.string().url().optional(),
  NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS: z.string().optional(),
  
  // AgentKit CDP Wallet
  CDP_API_KEY_NAME: z.string().optional(),
  CDP_API_KEY_PRIVATE_KEY: z.string().optional(),
  NETWORK_ID: z.string().optional(),
  
  // API Keys
  OPENAI_API_KEY: z.string().min(1).optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

/**
 * Validate environment variables against schema
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    // Log error but don't throw to prevent app from crashing
    console.warn('Continuing with available environment variables')
  }
}

// Call validation function
validateEnv()

/**
 * Environment variables with type safety
 */
export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-anon-key',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  
  // Blockchain - General
  NEXT_PUBLIC_NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID || '',
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || '',
  
  // Base
  NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org',
  NEXT_PUBLIC_BASE_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_BASE || '',
  
  // zkSync
  NEXT_PUBLIC_ZKSYNC_RPC_URL: process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || 'https://testnet.era.zksync.dev',
  NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_ZKSYNC_CONTRACT_ADDRESS || '',
  NEXT_PUBLIC_ZKSYNC_NETWORK: process.env.NEXT_PUBLIC_ZKSYNC_NETWORK || 'testnet',
  
  // Flow
  NEXT_PUBLIC_FLOW_ACCESS_NODE: process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
  NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS || '',
  
  // AgentKit CDP Wallet
  CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME || '',
  CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY || '',
  NETWORK_ID: process.env.NETWORK_ID || 'base-sepolia',
  
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const 