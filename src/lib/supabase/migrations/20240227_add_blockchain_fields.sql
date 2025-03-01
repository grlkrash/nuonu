-- Create chain_status type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chain_status') THEN
        CREATE TYPE chain_status AS ENUM (
            'pending',
            'submitted_base',
            'submitted_zksync',
            'submitted_both',
            'failed'
        );
    END IF;
END
$$;

-- Add blockchain-related columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS zksync_transaction_hash TEXT,
ADD COLUMN IF NOT EXISTS chain_status chain_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS chain TEXT CHECK (chain IN ('base', 'zksync')),
ADD COLUMN IF NOT EXISTS onchain_status INTEGER,
ADD COLUMN IF NOT EXISTS onchain_timestamp BIGINT;

-- Create index for content hash
CREATE INDEX IF NOT EXISTS idx_applications_content_hash 
ON applications(content_hash);

-- Create index for transaction hashes
CREATE INDEX IF NOT EXISTS idx_applications_transaction_hash 
ON applications(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_applications_zksync_transaction_hash 
ON applications(zksync_transaction_hash);

-- Create index for chain status
CREATE INDEX IF NOT EXISTS idx_applications_chain_status 
ON applications(chain_status); 