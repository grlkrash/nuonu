import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  
  // Blockchain
  NEXT_PUBLIC_NETWORK_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_RPC_URL: z.string().url().optional(),
  
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
  
  // Blockchain
  NEXT_PUBLIC_NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID || '',
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || '',
  
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const 