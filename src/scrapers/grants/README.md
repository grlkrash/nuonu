# Blockchain Grants Scraper

This directory contains scripts for scraping grant data from [blockchaingrants.org](https://blockchaingrants.org/) and storing it in both local JSON files and a Supabase database.

## Overview

The scraper is designed to extract grant information including titles, amounts, deadlines, descriptions, categories, and application URLs. The process is split into multiple scripts to allow for flexibility and better error handling:

1. `blockchain_grants_scraper.js` - The basic scraper that extracts grant data and saves it to a local JSON file
2. `blockchain_grants_improved.js` - An improved version that extracts more detailed information
3. `blockchain_grants_content_extractor.js` - A specialized script for extracting better descriptions
4. `final_report.js` - Generates a comprehensive report with statistics and enhanced grant data
5. `upload_grants_to_opportunities.js` - Uploads grant data to the existing opportunities table in Supabase

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account and project
- At least one profile in the Supabase profiles table (for the opportunities integration)

## Installation

1. Install dependencies:

```bash
npm install playwright @supabase/supabase-js dotenv uuid
```

2. Create a `.env` file in the root directory of the project with your Supabase credentials:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Usage

### Basic Scraping

To run the basic scraper:

```bash
node blockchain_grants_scraper.js
```

This will:
- Navigate to the main page
- Extract grant information from the cards
- Save screenshots of the main page and grant cards
- Save the extracted data to `detailed_grants.json`

### Enhanced Content Extraction

To extract better descriptions and details:

```bash
node blockchain_grants_content_extractor.js
```

This will:
- Read the existing grant data from `detailed_grants.json`
- Visit each grant page and apply multiple strategies to extract better descriptions
- Save the enhanced data to `enhanced_grants.json`

### Generate Final Report

To create a comprehensive report with statistics:

```bash
node final_report.js
```

This will:
- Read the enhanced grant data from `enhanced_grants.json`
- Generate statistics including total grants, average description length, category counts, and amount ranges
- Save the final report to `final_grants_report.json`

### Upload to Opportunities Table

To upload the grant data to the existing opportunities table in Supabase:

```bash
node upload_grants_to_opportunities.js
```

This will:
- Read the grant data from `final_grants_report.json`
- Get a valid creator_id from the profiles table
- Process each grant and map the fields to the opportunities table structure
- Insert each grant as an opportunity in the opportunities table

For detailed instructions on the opportunities integration, see the `OPPORTUNITIES_INTEGRATION.md` file.

## Data Structure

The grant data is stored in the following format:

```json
{
  "title": "Grant Title",
  "amount": "Grant Amount",
  "deadline": "Application Deadline",
  "description": "Detailed description of the grant",
  "categories": ["Category1", "Category2"],
  "applicationUrl": "URL to apply for the grant",
  "link": "URL of the grant page"
}
```

The final report includes additional statistics:

```json
{
  "timestamp": "ISO date string",
  "stats": {
    "totalGrants": 10,
    "averageDescriptionLength": 989,
    "categoryCounts": {
      "bitcoin grants": 1,
      "blockchain development": 4,
      "blockchain grants": 2,
      "blockchain infrastructure": 3
    },
    "amountRanges": {
      "unknown": 1,
      "lessThan10k": 8,
      "between10kAnd50k": 0,
      "between50kAnd100k": 0,
      "between100kAnd250k": 0,
      "moreThan250k": 1
    }
  },
  "grants": [...]
}
```

## Opportunities Table Structure

The opportunities table in Supabase has the following structure:

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

## Error Handling

The scripts include comprehensive error handling to:
- Skip non-grant pages
- Continue processing if a grant page fails
- Log issues during the scraping process
- Save data to local JSON files as a backup

## Complete Workflow

For the best results, follow this workflow:

1. Run the basic scraper to get initial data:
   ```bash
   node blockchain_grants_scraper.js
   ```

2. Run the content extractor to enhance the descriptions:
   ```bash
   node blockchain_grants_content_extractor.js
   ```

3. Generate the final report with statistics:
   ```bash
   node final_report.js
   ```

4. Upload the grant data to the opportunities table:
   ```bash
   node upload_grants_to_opportunities.js
   ```

## Troubleshooting

- If you encounter issues with the scraper, check the screenshots and HTML files saved in the `screenshots` and `content_screenshots` directories
- If you have problems with the Supabase integration, ensure that your credentials are correct and that you have at least one profile in the profiles table
- For issues with the opportunities integration, see the `OPPORTUNITIES_INTEGRATION.md` file for detailed troubleshooting steps

## Next Steps

- Build a frontend application to display the grants alongside other opportunities
- Set up scheduled scraping to keep the data up-to-date
- Implement search and filtering functionality
- Create visualizations and analytics based on the combined data

## License

This project is licensed under the MIT License - see the LICENSE file for details. 