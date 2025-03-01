-- SQL script to create the grants table in Supabase
-- Run this in the Supabase SQL Editor

-- Create the grants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.grants (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  amount TEXT,
  deadline TEXT,
  description TEXT,
  categories TEXT[],
  application_url TEXT,
  link TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to the table
COMMENT ON TABLE public.grants IS 'Table storing blockchain grant information';

-- Create an index on the link column for faster lookups
CREATE INDEX IF NOT EXISTS grants_link_idx ON public.grants (link);

-- Enable Row Level Security (RLS)
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" 
  ON public.grants 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Create a policy that allows read-only access for anonymous users
CREATE POLICY "Allow read-only access for anonymous users" 
  ON public.grants 
  FOR SELECT 
  TO anon 
  USING (true);

-- Output a message to confirm the table was created
SELECT 'Grants table created successfully' AS message; 