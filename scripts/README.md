# Database Migration Scripts

This directory contains scripts for managing database migrations.

## Available Scripts

### migrate-db.js

This script adds tags to the opportunities table and updates existing opportunities with relevant tags based on their content.

#### Prerequisites

- Node.js installed
- `.env.local` file with the following variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (not the anon key)

#### Usage

You can run the migration in two ways:

1. Using npm script:
   ```bash
   npm run migrate
   ```

2. Directly:
   ```bash
   node scripts/migrate-db.js
   ```

#### What the Script Does

1. Creates the `exec_sql` function if it doesn't exist
2. Adds a `tags` column to the `opportunities` table
3. Creates an index on the `tags` column for faster searches
4. Updates RLS policies to include tags
5. Creates a function to search opportunities by tag
6. Updates existing opportunities with relevant tags based on their title, description, category, and remote status

#### Troubleshooting

If you encounter any issues:

1. Make sure your `.env.local` file contains the correct Supabase credentials
2. Check that you have the necessary permissions to modify the database schema
3. If the migration fails, you can run it again - it's designed to be idempotent

## Adding New Migrations

When adding new migrations:

1. Create a new SQL file in the `supabase/migrations` directory with a timestamp prefix
2. Update or create a new migration script in this directory
3. Document the migration in this README 