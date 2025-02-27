-- Create agent_activities table for tracking AI agent actions
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

-- Add comment to the table
COMMENT ON TABLE public.agent_activities IS 'Table for tracking AI agent activities for artists';

-- Add comments to columns
COMMENT ON COLUMN public.agent_activities.id IS 'Unique identifier for the activity';
COMMENT ON COLUMN public.agent_activities.artist_id IS 'Reference to the artist profile';
COMMENT ON COLUMN public.agent_activities.activity_type IS 'Type of activity (discover_opportunities, match_opportunities, generate_application, etc.)';
COMMENT ON COLUMN public.agent_activities.status IS 'Status of the activity (in_progress, completed, failed)';
COMMENT ON COLUMN public.agent_activities.details IS 'JSON details about the activity';
COMMENT ON COLUMN public.agent_activities.created_at IS 'Timestamp when the activity was created';
COMMENT ON COLUMN public.agent_activities.updated_at IS 'Timestamp when the activity was last updated'; 