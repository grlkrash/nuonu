# Integrating Blockchain Grants with Opportunities Table

This document provides instructions on how to upload blockchain grant data to the existing `opportunities` table in Supabase.

## Overview

The blockchain grants scraper extracts grant information from [blockchaingrants.org](https://blockchaingrants.org/) and can now upload this data to the `opportunities` table in Supabase. This integration allows the grant data to be displayed alongside other opportunities in your application.

## Opportunities Table Structure

The `opportunities` table has the following structure:

- `id` (UUID, primary key)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone, nullable)
- `title` (text, required)
- `description` (text, required)
- `requirements` (text, nullable)
- `budget` (numeric, nullable)
- `deadline` (timestamp with time zone, nullable)
- `status` (enum: 'draft', 'archived', 'open', 'closed', default: 'draft')
- `creator_id` (UUID, required, foreign key to profiles.id)
- `category` (nullable)
- `location` (nullable)
- `is_remote` (boolean, default: true)
- `tags` (array, default: [])

## Field Mapping

The grant data is mapped to the opportunities table as follows:

| Grant Field | Opportunities Field | Notes |
|-------------|---------------------|-------|
| title | title | Direct mapping |
| description | description | Direct mapping |
| amount | budget | Numeric value extracted from amount string |
| deadline | deadline | Converted to ISO date format |
| categories | tags | Direct mapping |
| applicationUrl | requirements | Included in requirements text |
| link | requirements | Included in requirements text |

## Prerequisites

- A Supabase account and project
- The Supabase URL and service role key (in the `.env` file)
- At least one profile in the `profiles` table (for the `creator_id` field)

## Usage

To upload grant data to the opportunities table:

```bash
node upload_grants_to_opportunities.js
```

This script will:
1. Read the grant data from the `final_grants_report.json` file
2. Get a valid creator_id from the profiles table
3. Process each grant:
   - Extract a numeric value from the amount string
   - Convert the deadline string to an ISO date
   - Map the grant fields to opportunity fields
4. Insert each grant as an opportunity
5. Verify that the data was inserted correctly

## Data Transformation

### Amount to Budget

The script extracts numeric values from amount strings:
- "Upto $10K" → 10
- "Up to $30,000" → 30000
- "5 ETH" → 5

### Deadline to ISO Date

The script converts deadline strings to ISO dates:
- "Jan 22" → "2026-01-22T07:00:00.000Z"
- "Jan 21" → "2026-01-21T07:00:00.000Z"

## Troubleshooting

If you encounter issues with the upload process:

- Ensure that the `final_grants_report.json` file exists and contains valid data
- Verify that there is at least one profile in the `profiles` table
- Check that your Supabase URL and key are correct in the `.env` file
- Examine the error messages for specific issues with field mappings

## Next Steps

After uploading the grant data to the opportunities table, you can:

1. Display the grants alongside other opportunities in your application
2. Implement filtering and search functionality
3. Set up scheduled scraping to keep the grant data up-to-date
4. Create visualizations and analytics based on the combined data 