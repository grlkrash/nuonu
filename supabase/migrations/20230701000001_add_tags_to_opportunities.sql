-- Add tags column to opportunities table
ALTER TABLE public.opportunities ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create an index on the tags column for faster searches
CREATE INDEX idx_opportunities_tags ON public.opportunities USING GIN (tags);

-- Update RLS policies to include tags
CREATE POLICY "Users can view opportunity tags" 
ON public.opportunities 
FOR SELECT 
USING (true);

CREATE POLICY "Creators can update opportunity tags" 
ON public.opportunities 
FOR UPDATE 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Add comment to the column
COMMENT ON COLUMN public.opportunities.tags IS 'Array of tags associated with the opportunity';

-- Create a function to search opportunities by tag
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