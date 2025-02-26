-- Check if opportunity_status type exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status') THEN
        CREATE TYPE opportunity_status AS ENUM ('open', 'closed', 'draft', 'archived');
    END IF;
END
$$;

-- Check if application_status type exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
    END IF;
END
$$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  bio TEXT,
  website TEXT,
  avatar_url TEXT
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget NUMERIC,
  deadline TIMESTAMP WITH TIME ZONE,
  status opportunity_status DEFAULT 'draft' NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT TRUE NOT NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  status application_status DEFAULT 'pending' NOT NULL,
  portfolio_url TEXT,
  contact_info TEXT
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_id') THEN
        CREATE INDEX idx_profiles_id ON profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_creator_id') THEN
        CREATE INDEX idx_opportunities_creator_id ON opportunities(creator_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_opportunities_status') THEN
        CREATE INDEX idx_opportunities_status ON opportunities(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_opportunity_id') THEN
        CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_applicant_id') THEN
        CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_applications_status') THEN
        CREATE INDEX idx_applications_status ON applications(status);
    END IF;
END
$$;

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles" 
        ON profiles FOR SELECT 
        USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;

-- Opportunities policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'opportunities' AND policyname = 'Users can view all opportunities'
    ) THEN
        CREATE POLICY "Users can view all opportunities" 
        ON opportunities FOR SELECT 
        USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'opportunities' AND policyname = 'Creators can insert opportunities'
    ) THEN
        CREATE POLICY "Creators can insert opportunities" 
        ON opportunities FOR INSERT 
        WITH CHECK (auth.uid() = creator_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'opportunities' AND policyname = 'Creators can update their opportunities'
    ) THEN
        CREATE POLICY "Creators can update their opportunities" 
        ON opportunities FOR UPDATE 
        USING (auth.uid() = creator_id)
        WITH CHECK (auth.uid() = creator_id);
    END IF;
END
$$;

-- Applications policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' AND policyname = 'Users can view their own applications and applications for their opportunities'
    ) THEN
        CREATE POLICY "Users can view their own applications and applications for their opportunities" 
        ON applications FOR SELECT 
        USING (
          auth.uid() = applicant_id OR 
          auth.uid() IN (
            SELECT creator_id FROM opportunities WHERE id = opportunity_id
          )
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' AND policyname = 'Users can insert their own applications'
    ) THEN
        CREATE POLICY "Users can insert their own applications" 
        ON applications FOR INSERT 
        WITH CHECK (auth.uid() = applicant_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' AND policyname = 'Users can update their own applications'
    ) THEN
        CREATE POLICY "Users can update their own applications" 
        ON applications FOR UPDATE 
        USING (auth.uid() = applicant_id)
        WITH CHECK (auth.uid() = applicant_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' AND policyname = 'Opportunity creators can update applications for their opportunities'
    ) THEN
        CREATE POLICY "Opportunity creators can update applications for their opportunities" 
        ON applications FOR UPDATE 
        USING (
          auth.uid() IN (
            SELECT creator_id FROM opportunities WHERE id = opportunity_id
          )
        )
        WITH CHECK (
          auth.uid() IN (
            SELECT creator_id FROM opportunities WHERE id = opportunity_id
          )
        );
    END IF;
END
$$;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$; 