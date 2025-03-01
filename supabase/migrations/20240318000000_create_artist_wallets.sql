-- Create wallet_status enum
CREATE TYPE wallet_status AS ENUM ('active', 'inactive', 'pending', 'blocked');

-- Create artist_wallets table
CREATE TABLE artist_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  blockchain TEXT NOT NULL DEFAULT 'ethereum',
  status wallet_status NOT NULL DEFAULT 'pending',
  balance JSONB,
  last_sync TIMESTAMP WITH TIME ZONE,
  UNIQUE(artist_id, blockchain),
  UNIQUE(wallet_address),
  UNIQUE(wallet_id)
);

-- Create index for faster lookups
CREATE INDEX artist_wallets_artist_id_idx ON artist_wallets(artist_id);
CREATE INDEX artist_wallets_wallet_address_idx ON artist_wallets(wallet_address);
CREATE INDEX artist_wallets_wallet_id_idx ON artist_wallets(wallet_id);

-- Enable Row Level Security
ALTER TABLE artist_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON artist_wallets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own wallet"
  ON artist_wallets FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Users can update their own wallet"
  ON artist_wallets FOR UPDATE
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at
CREATE TRIGGER update_artist_wallets_updated_at
  BEFORE UPDATE ON artist_wallets
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 