# Database Migration Guide

This guide provides step-by-step instructions for running the database migration to add tags to the opportunities table.

## Prerequisites

Before running the migration, ensure you have:

1. Node.js installed on your system
2. Access to your Supabase project
3. The Supabase service role key (not the anon key)

## Step 1: Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Update the following variables with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

## Step 2: Test the Migration Setup

Run the test script to check if the migration is needed and if your environment is properly configured:

```bash
node scripts/test-migration.js
```

This script will:
- Check if your environment variables are set
- Test the connection to Supabase
- Check if the opportunities table already has a tags column

If the script reports that the tags column doesn't exist, proceed to the next step.

## Step 3: Run the Migration

Run the migration script using npm:

```bash
npm run migrate
```

Or directly:

```bash
node scripts/migrate-db.js
```

The script will:
1. Create the `exec_sql` function if it doesn't exist
2. Add the `tags` column to the `opportunities` table
3. Create an index on the `tags` column for faster searches
4. Update RLS policies to include tags
5. Create a function to search opportunities by tag
6. Update existing opportunities with relevant tags based on their content

## Step 4: Verify the Migration

Run the test script again to verify that the migration was successful:

```bash
node scripts/test-migration.js
```

The script should now report that the tags column exists in the opportunities table.

## Troubleshooting

If you encounter any issues during the migration:

1. **Connection errors**: Ensure your Supabase credentials are correct and that your IP is allowed to access the database.

2. **Permission errors**: Make sure the service role key has the necessary permissions to create functions and modify tables.

3. **SQL errors**: If the migration fails due to SQL errors, check the Supabase SQL editor for more detailed error messages.

4. **Already exists errors**: If you see errors about objects already existing, it might mean that part of the migration was already applied. This is generally safe to ignore.

## Next Steps

After successfully running the migration:

1. Update your application code to use the new tags functionality
2. Test the tags filtering in your application
3. Consider adding a UI for managing tags on opportunities

For more information, see the [Refactoring Plan](./refactoring-plan.md) and [Implementation Summary](./implementation-summary.md). 