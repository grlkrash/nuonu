require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function setupAgentActivitiesTable() {
  console.log('Setting up agent_activities table...')

  try {
    // Create the exec_sql function if it doesn't exist
    try {
      const { error: funcError } = await supabase.rpc('exec_sql', {
        sql_string: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
          RETURNS void AS $$
          BEGIN
            EXECUTE sql_string;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      })
      
      if (funcError) {
        console.error('Error calling exec_sql function:', funcError)
        // If the function doesn't exist yet, create it directly
        const { error: directError } = await supabase.sql(`
          CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
          RETURNS void AS $$
          BEGIN
            EXECUTE sql_string;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `)
        
        if (directError) {
          console.error('Error creating exec_sql function directly:', directError)
          return
        }
      }
    } catch (rpcError) {
      console.log('Trying to create exec_sql function directly...')
      const { error: directError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION exec_sql(sql_string text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql_string;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `)
      
      if (directError) {
        console.error('Error creating exec_sql function directly:', directError)
        return
      }
    }

    // Create the agent_activities table directly with SQL
    console.log('Creating agent_activities table...')
    const { error: createTableError } = await supabase.sql(`
      CREATE TABLE IF NOT EXISTS public.agent_activities (
        id UUID PRIMARY KEY,
        artist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        status TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index on artist_id for faster queries
      CREATE INDEX IF NOT EXISTS agent_activities_artist_id_idx ON public.agent_activities(artist_id);
      
      -- Create index on activity_type for filtering
      CREATE INDEX IF NOT EXISTS agent_activities_activity_type_idx ON public.agent_activities(activity_type);
      
      -- Create index on status for filtering
      CREATE INDEX IF NOT EXISTS agent_activities_status_idx ON public.agent_activities(status);
      
      -- Add RLS policies
      ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own agent activities" ON public.agent_activities;
      DROP POLICY IF EXISTS "Users can insert their own agent activities" ON public.agent_activities;
      DROP POLICY IF EXISTS "Users can update their own agent activities" ON public.agent_activities;
      
      -- Create policies
      CREATE POLICY "Users can view their own agent activities"
        ON public.agent_activities
        FOR SELECT
        USING (auth.uid() = artist_id);
        
      CREATE POLICY "Users can insert their own agent activities"
        ON public.agent_activities
        FOR INSERT
        WITH CHECK (auth.uid() = artist_id);
        
      CREATE POLICY "Users can update their own agent activities"
        ON public.agent_activities
        FOR UPDATE
        USING (auth.uid() = artist_id);
    `)

    if (createTableError) {
      console.error('Error creating agent_activities table:', createTableError)
      return
    }

    console.log('Agent activities table setup completed successfully!')
  } catch (error) {
    console.error('Error setting up agent_activities table:', error)
  }
}

// Run the setup
setupAgentActivitiesTable() 