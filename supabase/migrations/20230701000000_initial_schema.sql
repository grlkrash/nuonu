-- Create enums
CREATE TYPE opportunity_status AS ENUM ('open', 'closed', 'draft', 'archived');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  bio TEXT,
  website TEXT,
  avatar_url TEXT
);

-- Create opportunities table
CREATE TABLE opportunities (
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
CREATE TABLE applications (
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

-- Create indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_opportunities_creator_id ON opportunities(creator_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Opportunities policies
CREATE POLICY "Opportunities are viewable by everyone" 
  ON opportunities FOR SELECT USING (true);

CREATE POLICY "Users can insert their own opportunities" 
  ON opportunities FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own opportunities" 
  ON opportunities FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own opportunities" 
  ON opportunities FOR DELETE USING (auth.uid() = creator_id);

-- Applications policies
CREATE POLICY "Applications are viewable by the applicant and opportunity creator" 
  ON applications FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (
      SELECT creator_id FROM opportunities WHERE id = opportunity_id
    )
  );

CREATE POLICY "Users can insert their own applications" 
  ON applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update their own applications" 
  ON applications FOR UPDATE USING (auth.uid() = applicant_id);

CREATE POLICY "Users can delete their own applications" 
  ON applications FOR DELETE USING (auth.uid() = applicant_id);

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 