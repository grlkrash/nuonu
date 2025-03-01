# Supabase Integration Setup

This document provides instructions on how to set up the Supabase integration for the blockchain grants scraper.

## Prerequisites

- A Supabase account and project
- The Supabase URL and service role key (already in the `.env` file)

## Setting Up the Grants Table

The grants table needs to be created manually in the Supabase dashboard. Follow these steps:

1. Log in to your Supabase account and navigate to your project
2. Go to the SQL Editor (in the left sidebar)
3. Create a new query
4. Copy and paste the contents of the `create_grants_table.sql` file into the query editor
5. Run the query

The SQL script will:
- Create the grants table with the necessary columns
- Add appropriate indexes
- Set up Row Level Security (RLS) policies
- Provide confirmation that the table was created successfully

## Uploading Grant Data

After creating the table, you can upload the grant data using the `supabase_data_uploader.js` script:

```bash
node supabase_data_uploader.js
```

This script will:
1. Read the grant data from the `final_grants_report.json` file
2. Check if the grants table exists
3. Upload each grant to the Supabase database
4. Verify that the data was inserted correctly

## Troubleshooting

If you encounter issues with the Supabase integration, check the following:

### Table Creation Issues

- Ensure you have the correct permissions in your Supabase project
- Check that the SQL script ran without errors
- Verify that the grants table appears in the Table Editor in Supabase

### Data Upload Issues

- Confirm that your Supabase URL and key are correct in the `.env` file
- Check that the grants table has the expected structure
- Ensure that the `final_grants_report.json` file exists and contains valid data

### Connection Issues

- Verify that your Supabase project is active
- Check your internet connection
- Ensure that the Supabase service is not experiencing downtime

## Viewing the Data

After uploading the data, you can view it in the Supabase dashboard:

1. Go to the Table Editor (in the left sidebar)
2. Select the grants table
3. Browse the uploaded grant data

You can also run SQL queries to analyze the data in the SQL Editor.

## Next Steps

Once the data is in Supabase, you can:

1. Build a frontend application to display the grants
2. Set up scheduled scraping to keep the data up-to-date
3. Implement search and filtering functionality
4. Create visualizations and analytics based on the grant data 