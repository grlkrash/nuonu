-- Add tags column to opportunities table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.opportunities ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END
$$;

-- Create an index on the tags column for faster searches if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_tags') THEN
        CREATE INDEX idx_opportunities_tags ON public.opportunities USING GIN (tags);
    END IF;
END
$$;

-- Update RLS policies to include tags if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'opportunities' AND policyname = 'Users can view opportunity tags'
    ) THEN
        CREATE POLICY "Users can view opportunity tags" 
        ON public.opportunities 
        FOR SELECT 
        USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'opportunities' AND policyname = 'Creators can update opportunity tags'
    ) THEN
        CREATE POLICY "Creators can update opportunity tags" 
        ON public.opportunities 
        FOR UPDATE 
        USING (auth.uid() = creator_id)
        WITH CHECK (auth.uid() = creator_id);
    END IF;
END
$$;

-- Add comment to the column
COMMENT ON COLUMN public.opportunities.tags IS 'Array of tags associated with the opportunity';

-- Create a function to search opportunities by tag if it doesn't exist
CREATE OR REPLACE FUNCTION public.search_opportunities_by_tag(search_tag TEXT)
RETURNS SETOF public.opportunities
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.opportunities
  WHERE search_tag = ANY(tags)
  ORDER BY created_at DESC;
$$; 