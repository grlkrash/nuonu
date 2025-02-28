-- Create chain_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chain_type') THEN
        CREATE TYPE chain_type AS ENUM ('base', 'zksync', 'flow');
    END IF;
END
$$;

-- Add new columns to artist_wallets table
ALTER TABLE artist_wallets 
ADD COLUMN IF NOT EXISTS chain_type chain_type NOT NULL DEFAULT 'base',
ADD COLUMN IF NOT EXISTS chain_specific_data JSONB;

-- Create index for chain_type
CREATE INDEX IF NOT EXISTS idx_artist_wallets_chain_type ON artist_wallets(chain_type);

-- Update existing rows to have chain_type='base'
UPDATE artist_wallets 
SET chain_type = 'base' 
WHERE chain_type IS NULL;

-- Add a unique constraint to prevent duplicate wallets per chain for an artist
ALTER TABLE artist_wallets 
DROP CONSTRAINT IF EXISTS unique_artist_chain_wallet,
ADD CONSTRAINT unique_artist_chain_wallet UNIQUE (artist_id, chain_type);

-- Update RLS policies to handle chain-specific access
CREATE POLICY "Users can view their own wallets across chains"
ON artist_wallets FOR SELECT
USING (auth.uid() = artist_id);

-- Add function to validate chain-specific data
CREATE OR REPLACE FUNCTION validate_chain_specific_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate base chain data
    IF NEW.chain_type = 'base' THEN
        IF NOT (NEW.chain_specific_data ? 'cdp_wallet_id') THEN
            RAISE EXCEPTION 'Base chain wallet requires CDP wallet ID';
        END IF;
    END IF;

    -- Validate zkSync chain data
    IF NEW.chain_type = 'zksync' THEN
        IF NOT (NEW.chain_specific_data ? 'session_key') THEN
            RAISE EXCEPTION 'zkSync wallet requires session key';
        END IF;
    END IF;

    -- Validate Flow chain data
    IF NEW.chain_type = 'flow' THEN
        IF NOT (NEW.chain_specific_data ? 'flow_account_key') THEN
            RAISE EXCEPTION 'Flow wallet requires account key';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chain-specific data validation
DROP TRIGGER IF EXISTS validate_chain_specific_data_trigger ON artist_wallets;
CREATE TRIGGER validate_chain_specific_data_trigger
    BEFORE INSERT OR UPDATE ON artist_wallets
    FOR EACH ROW
    EXECUTE FUNCTION validate_chain_specific_data(); 