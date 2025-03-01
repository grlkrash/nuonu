require('dotenv').config({ path: '../../../.env' });
const fs = require('fs').promises;
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Configuration
const MAIN_URL = 'https://blockchaingrants.org/';
const SCREENSHOTS_DIR = './screenshots';
const LOCAL_JSON_FILE = 'detailed_grants.json';
const USE_SUPABASE = supabase !== null;

// Ensure screenshots directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

// Create grants table in Supabase if it doesn't exist
async function createGrantsTable() {
  if (!USE_SUPABASE) return true;
  
  console.log('Checking if grants table exists...');
  
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from('grants')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('Creating grants table...');
      
      // Try different methods to create the table
      try {
        // Method 1: Using RPC
        const { error: createError } = await supabase.rpc('create_grants_table');
        
        if (createError) {
          console.log('RPC method not found, creating table directly...');
          
          // Method 2: Using SQL
          const { error: sqlError } = await supabase.sql(`
            CREATE TABLE IF NOT EXISTS grants (
              id SERIAL PRIMARY KEY,
              title TEXT NOT NULL,
              amount TEXT,
              deadline TEXT,
              description TEXT,
              categories TEXT[],
              application_url TEXT,
              link TEXT UNIQUE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `);
          
          if (sqlError) {
            console.error('Error creating grants table with SQL:', sqlError);
            
            // Method 3: Try to create the table by inserting a test record
            console.log('Attempting to create table by inserting a test record...');
            const { error: insertError } = await supabase
              .from('grants')
              .insert([
                {
                  title: 'Test Grant',
                  amount: 'Test Amount',
                  deadline: 'Test Deadline',
                  description: 'Test Description',
                  categories: ['Test Category'],
                  link: 'https://example.com/test'
                }
              ]);
            
            if (insertError) {
              console.error('Failed to create grants table:', insertError);
              return false;
            }
            
            // Delete the test record
            await supabase
              .from('grants')
              .delete()
              .eq('link', 'https://example.com/test');
          }
        }
      } catch (error) {
        console.error('Error creating grants table:', error);
        return false;
      }
    } else {
      console.log('Grants table already exists.');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking or creating grants table:', error);
    return false;
  }
}

// Insert grants into Supabase
async function insertGrantsToSupabase(grants) {
  if (!USE_SUPABASE) {
    console.log('Supabase integration disabled. Skipping database insertion.');
    return 0;
  }
  
  let successCount = 0;
  
  for (const grant of grants) {
    try {
      console.log(`Inserting grant into Supabase: ${grant.title}`);
      
      // Format the data for Supabase
      const formattedGrant = {
        title: grant.title,
        amount: grant.amount,
        deadline: grant.deadline,
        description: grant.description,
        categories: grant.categories,
        application_url: grant.applicationUrl,
        link: grant.link
      };
      
      // Insert the grant into Supabase
      const { error } = await supabase
        .from('grants')
        .upsert([formattedGrant], {
          onConflict: 'link',
          returning: 'minimal'
        });
      
      if (error) {
        console.error(`Error inserting grant "${grant.title}":`, error);
      } else {
        console.log(`Successfully inserted grant: ${grant.title}`);
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing grant "${grant.title}":`, error);
    }
  }
  
  return successCount;
}

// Main scraping function
async function scrapeBlockchainGrants() {
  console.log('Starting blockchain grants scraper...');
  
  // Create screenshots directory
  await ensureDir(SCREENSHOTS_DIR);
  
  // Initialize browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // If using Supabase, ensure the grants table exists
    if (USE_SUPABASE) {
      const tableCreated = await createGrantsTable();
      if (!tableCreated) {
        console.error('Failed to create or verify grants table. Continuing without Supabase integration.');
      }
    }
    
    // Navigate to the main page
    console.log(`Navigating to ${MAIN_URL}...`);
    await page.goto(MAIN_URL, { waitUntil: 'networkidle' });
    
    // Take a screenshot of the main page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'main_page.png') });
    console.log('Saved screenshot of main page');
    
    // Extract grants from the main page
    console.log('Extracting grants from main page...');
    const grants = await page.evaluate(() => {
      const grantCards = Array.from(document.querySelectorAll('.grant-card'));
      
      return grantCards.map(card => {
        // Extract title and link
        const titleElement = card.querySelector('.grant-title a');
        const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
        const link = titleElement ? titleElement.href : '';
        
        // Extract amount
        const amountElement = card.querySelector('.grant-amount');
        const amount = amountElement ? amountElement.textContent.trim() : 'Unknown Amount';
        
        // Extract deadline
        const deadlineElement = card.querySelector('.grant-deadline');
        const deadline = deadlineElement ? deadlineElement.textContent.trim() : 'Unknown Deadline';
        
        // Extract initial description (all text content minus the title, amount, and deadline)
        const fullText = card.textContent.trim();
        let initialDescription = fullText
          .replace(title, '')
          .replace(amount, '')
          .replace(deadline, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Clean up common patterns in the description
        initialDescription = initialDescription
          .replace(/Apply by \w+ \d+/i, '')
          .replace(/Deadline: \w+ \d+/i, '')
          .trim();
        
        return {
          title,
          link,
          amount,
          deadline,
          initialDescription
        };
      });
    });
    
    console.log(`Found ${grants.length} potential grants on main page`);
    
    // Take screenshots of each grant card
    for (let i = 0; i < grants.length; i++) {
      try {
        const cardSelector = `.grant-card:nth-child(${i + 1})`;
        const cardElement = await page.$(cardSelector);
        
        if (cardElement) {
          await cardElement.screenshot({ path: path.join(SCREENSHOTS_DIR, `grant_card_${i + 1}.png`) });
          console.log(`Saved screenshot of grant card ${i + 1}`);
        }
      } catch (error) {
        console.error(`Error taking screenshot of grant card ${i + 1}:`, error);
      }
    }
    
    // Process each grant to get detailed information
    const detailedGrants = [];
    
    for (let i = 0; i < grants.length; i++) {
      const grant = grants[i];
      console.log(`Processing grant ${i + 1}/${grants.length}: ${grant.title}`);
      
      try {
        // Skip if the link is empty or not a valid URL
        if (!grant.link || !grant.link.startsWith('http')) {
          console.log(`Skipping grant with invalid link: ${grant.title}`);
          continue;
        }
        
        // Navigate to the grant page
        await page.goto(grant.link, { waitUntil: 'networkidle' });
        console.log(`Navigated to ${grant.link}`);
        
        // Take a screenshot of the grant page
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `grant_page_${i + 1}.png`) });
        
        // Extract detailed information
        const detailedInfo = await page.evaluate((initialDescription) => {
          // Extract amount (try different selectors)
          let amount = document.querySelector('.grant-amount')?.textContent.trim() || 
                       document.querySelector('.amount')?.textContent.trim() || 
                       document.querySelector('*:contains("Amount:")');
          
          if (amount && amount.textContent) {
            amount = amount.textContent.replace('Amount:', '').trim();
          }
          
          // Extract deadline (try different selectors)
          let deadline = document.querySelector('.grant-deadline')?.textContent.trim() || 
                         document.querySelector('.deadline')?.textContent.trim() || 
                         document.querySelector('*:contains("Deadline:")');
          
          if (deadline && deadline.textContent) {
            deadline = deadline.textContent.replace('Deadline:', '').trim();
          }
          
          // Extract description
          let description = '';
          
          // Try to find the main content area
          const contentArea = document.querySelector('.grant-description') || 
                              document.querySelector('.description') || 
                              document.querySelector('article') || 
                              document.querySelector('main');
          
          if (contentArea) {
            description = contentArea.textContent.trim();
          }
          
          // If no description found, use the initial description
          if (!description && initialDescription) {
            description = initialDescription;
          }
          
          // If still no description, use a fallback
          if (!description) {
            description = 'No detailed description available';
          }
          
          // Clean up the description
          description = description
            .replace(/\s+/g, ' ')
            .replace(/Apply by \w+ \d+/i, '')
            .replace(/Deadline: \w+ \d+/i, '')
            .trim();
          
          // Extract categories
          const categories = [];
          const categoryElements = document.querySelectorAll('.grant-category, .category, .tag');
          
          categoryElements.forEach(element => {
            categories.push(element.textContent.trim());
          });
          
          // Extract application URL
          let applicationUrl = '';
          const applyButton = document.querySelector('a:contains("Apply"), a:contains("apply"), .apply-button');
          
          if (applyButton) {
            applicationUrl = applyButton.href;
          }
          
          return {
            amount,
            deadline,
            description,
            categories,
            applicationUrl
          };
        }, grant.initialDescription);
        
        // Combine initial and detailed information
        const detailedGrant = {
          title: grant.title,
          amount: detailedInfo.amount || grant.amount,
          deadline: detailedInfo.deadline || grant.deadline,
          description: detailedInfo.description || grant.initialDescription || 'No description available',
          categories: detailedInfo.categories || [],
          applicationUrl: detailedInfo.applicationUrl || '',
          link: grant.link
        };
        
        // Log the extracted information
        console.log(`Extracted grant details:
          - Title: ${detailedGrant.title}
          - Amount: ${detailedGrant.amount}
          - Deadline: ${detailedGrant.deadline}
          - Description length: ${detailedGrant.description.length} characters
          - Categories: ${detailedGrant.categories.join(', ')}
        `);
        
        detailedGrants.push(detailedGrant);
        
      } catch (error) {
        console.error(`Error processing grant ${grant.title}:`, error);
        
        // Add the grant with basic information
        detailedGrants.push({
          title: grant.title,
          amount: grant.amount,
          deadline: grant.deadline,
          description: grant.initialDescription || 'Error retrieving description',
          categories: [],
          applicationUrl: '',
          link: grant.link
        });
      }
    }
    
    // Save the detailed grants to a JSON file
    await fs.writeFile(LOCAL_JSON_FILE, JSON.stringify(detailedGrants, null, 2));
    console.log(`Saved ${detailedGrants.length} grants to ${LOCAL_JSON_FILE}`);
    
    // Insert grants into Supabase if enabled
    let insertedCount = 0;
    if (USE_SUPABASE) {
      insertedCount = await insertGrantsToSupabase(detailedGrants);
    }
    
    console.log(`Scraped and saved ${detailedGrants.length} grants (${insertedCount} inserted into Supabase)`);
    
    return detailedGrants;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the scraper
scrapeBlockchainGrants().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 