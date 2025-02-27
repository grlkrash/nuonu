require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { runAutonomousAgent } = require('../src/lib/services/agent-activities')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function runAgent() {
  // Check if artist ID was provided as command line argument
  const artistId = process.argv[2]
  
  if (!artistId) {
    console.error('Please provide an artist ID as a command line argument')
    console.log('Usage: node scripts/run-autonomous-agent.js <artist_id>')
    process.exit(1)
  }

  console.log(`Running autonomous agent for artist ID: ${artistId}`)
  
  try {
    // Verify the artist exists
    const { data: artist, error: artistError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', artistId)
      .single()
    
    if (artistError || !artist) {
      console.error('Error: Artist not found', artistError)
      process.exit(1)
    }
    
    console.log(`Found artist: ${artist.full_name || 'Unknown'}`)
    
    // Run the autonomous agent
    const result = await runAutonomousAgent(artistId)
    
    console.log('Autonomous agent completed successfully!')
    console.log('Result:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('Error running autonomous agent:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the agent
runAgent() 