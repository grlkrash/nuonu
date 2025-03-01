const fs = require('fs').promises;
const { chromium } = require('playwright');
const path = require('path');

// Configuration
const SCREENSHOTS_DIR = './content_screenshots';
const DETAILED_GRANTS_FILE = 'detailed_grants.json';
const ENHANCED_GRANTS_FILE = 'enhanced_grants.json';

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

// Extract better content from grant pages
async function extractBetterContent() {
  console.log('Starting content extraction process...');
  
  // Create screenshots directory
  await ensureDir(SCREENSHOTS_DIR);
  
  // Read the existing grants data
  let grants;
  try {
    const grantsData = await fs.readFile(DETAILED_GRANTS_FILE, 'utf8');
    grants = JSON.parse(grantsData);
    console.log(`Read ${grants.length} grants from ${DETAILED_GRANTS_FILE}`);
  } catch (error) {
    console.error(`Error reading grants data from ${DETAILED_GRANTS_FILE}:`, error);
    return;
  }
  
  // Initialize browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  
  const enhancedGrants = [];
  
  try {
    for (let i = 0; i < grants.length; i++) {
      const grant = grants[i];
      console.log(`Processing grant ${i + 1}/${grants.length}: ${grant.title}`);
      
      // Skip if the link is empty or not a valid URL
      if (!grant.link || !grant.link.startsWith('http')) {
        console.log(`Skipping grant with invalid link: ${grant.title}`);
        enhancedGrants.push(grant);
        continue;
      }
      
      const page = await context.newPage();
      
      try {
        // Navigate to the grant page with a shorter timeout and don't wait for networkidle
        await page.goto(grant.link, { timeout: 15000 });
        console.log(`Navigated to ${grant.link}`);
        
        // Wait a bit for content to load
        await page.waitForTimeout(2000);
        
        // Take a screenshot of the grant page
        await page.screenshot({ 
          path: path.join(SCREENSHOTS_DIR, `grant_page_${i + 1}.png`),
          fullPage: true 
        });
        
        // Save the HTML content for debugging
        const html = await page.content();
        await fs.writeFile(path.join(SCREENSHOTS_DIR, `grant_page_${i + 1}.html`), html);
        
        // Extract better content using multiple strategies
        const enhancedContent = await page.evaluate(() => {
          // Helper function to clean text
          const cleanText = (text) => {
            if (!text) return '';
            return text
              .replace(/\s+/g, ' ')
              .replace(/\n+/g, ' ')
              .trim();
          };
          
          // Strategy 1: Look for specific content containers
          const contentSelectors = [
            '.grant-description',
            '.description',
            '.content',
            'article',
            'main',
            '.main-content',
            '#content',
            '.post-content',
            '.entry-content'
          ];
          
          let description = '';
          
          // Try each selector
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              const text = cleanText(element.textContent);
              if (text.length > description.length) {
                description = text;
              }
            }
          }
          
          // Strategy 2: Look for paragraphs
          if (!description || description.length < 100) {
            const paragraphs = Array.from(document.querySelectorAll('p'));
            const combinedParagraphs = paragraphs
              .map(p => cleanText(p.textContent))
              .filter(text => text.length > 20) // Filter out short paragraphs
              .join(' ');
            
            if (combinedParagraphs.length > description.length) {
              description = combinedParagraphs;
            }
          }
          
          // Strategy 3: Look for div elements with substantial text
          if (!description || description.length < 100) {
            const divs = Array.from(document.querySelectorAll('div'));
            const textDivs = divs
              .filter(div => {
                const text = cleanText(div.textContent);
                return text.length > 100 && div.children.length < 5;
              })
              .map(div => cleanText(div.textContent));
            
            if (textDivs.length > 0) {
              const longestDiv = textDivs.reduce((longest, current) => 
                current.length > longest.length ? current : longest, '');
              
              if (longestDiv.length > description.length) {
                description = longestDiv;
              }
            }
          }
          
          // Extract better amount information
          let amount = '';
          const amountRegex = /(?:amount|funding|grant|award)s?:?\s*((?:up to |max |maximum |minimum |min |)(?:\$|€|£|¥)?[\d,]+(?:\.\d+)?(?:\s*[km])?(?:\s*(?:usd|eur|gbp|jpy|eth|btc))?)/i;
          const amountMatch = document.body.textContent.match(amountRegex);
          
          if (amountMatch && amountMatch[1]) {
            amount = amountMatch[1].trim();
          }
          
          // Extract better deadline information
          let deadline = '';
          const deadlineRegex = /(?:deadline|due date|closes|applications close|apply by):?\s*(\w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i;
          const deadlineMatch = document.body.textContent.match(deadlineRegex);
          
          if (deadlineMatch && deadlineMatch[1]) {
            deadline = deadlineMatch[1].trim();
          }
          
          // Extract categories
          const categories = [];
          const categoryElements = document.querySelectorAll('.category, .tag, .grant-category');
          
          categoryElements.forEach(element => {
            const category = cleanText(element.textContent);
            if (category && !categories.includes(category)) {
              categories.push(category);
            }
          });
          
          // Extract application URL
          let applicationUrl = '';
          const applyButtons = Array.from(document.querySelectorAll('a')).filter(a => 
            a.textContent.toLowerCase().includes('apply') || 
            a.href.toLowerCase().includes('apply') ||
            a.className.toLowerCase().includes('apply')
          );
          
          if (applyButtons.length > 0) {
            applicationUrl = applyButtons[0].href;
          }
          
          return {
            description,
            amount,
            deadline,
            categories,
            applicationUrl
          };
        });
        
        // Combine with existing data, preferring the enhanced content
        const enhancedGrant = {
          title: grant.title,
          amount: enhancedContent.amount || grant.amount,
          deadline: enhancedContent.deadline || grant.deadline,
          description: enhancedContent.description || grant.description,
          categories: enhancedContent.categories.length > 0 ? enhancedContent.categories : grant.categories,
          applicationUrl: enhancedContent.applicationUrl || grant.applicationUrl,
          link: grant.link
        };
        
        // Log the extracted information
        console.log(`Enhanced grant details:
          - Title: ${enhancedGrant.title}
          - Amount: ${enhancedGrant.amount}
          - Deadline: ${enhancedGrant.deadline}
          - Description length: ${enhancedGrant.description.length} characters
          - Categories: ${enhancedGrant.categories.join(', ')}
        `);
        
        enhancedGrants.push(enhancedGrant);
        
      } catch (error) {
        console.error(`Error processing grant ${grant.title}:`, error);
        enhancedGrants.push(grant);
      } finally {
        await page.close();
      }
    }
    
    // Save the enhanced grants to a JSON file
    await fs.writeFile(ENHANCED_GRANTS_FILE, JSON.stringify(enhancedGrants, null, 2));
    console.log(`Saved ${enhancedGrants.length} enhanced grants to ${ENHANCED_GRANTS_FILE}`);
    
    return enhancedGrants;
    
  } catch (error) {
    console.error('Error during content extraction:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the content extractor
extractBetterContent().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 