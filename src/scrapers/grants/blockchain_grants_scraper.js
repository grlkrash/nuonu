require('dotenv').config({ path: '../../../.env' });
const { chromium } = require('playwright-core');
const fs = require('fs').promises;

async function scrapeBlockchainGrants() {
  // Use connect.browserbase.com instead of cloud.browserbase.io
  const browser = await chromium.connectOverCDP(`wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`);
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting scraping process...');
    
    // Go to the main page first
    await page.goto('https://blockchaingrants.org', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    
    // Take a screenshot of the main page
    await page.screenshot({ path: 'main_page.png' });
    console.log('Saved screenshot of main page');
    
    // Try to find grant cards
    const grantCards = await page.$$('.grid-cols-1 > div');
    console.log(`Found ${grantCards.length} potential grant cards`);
    
    // Extract basic data from each card on the main page
    const grantsBasicInfo = [];
    for (let i = 0; i < grantCards.length; i++) {
      try {
        const card = grantCards[i];
        
        // Extract text content for debugging
        const textContent = await card.evaluate(el => el.textContent.trim());
        console.log(`Card ${i + 1} text: ${textContent.substring(0, 100)}...`);
        
        // Extract link
        const link = await card.evaluate(el => {
          const linkEl = el.querySelector('a');
          return linkEl ? linkEl.href : '';
        });
        
        // Extract title
        const title = await card.evaluate(el => {
          const titleEl = el.querySelector('h2, h3, h4');
          return titleEl ? titleEl.textContent.trim() : '';
        });
        
        // Extract amount from the card
        const amount = await card.evaluate(el => {
          const text = el.textContent;
          const match = text.match(/(?:Up to |Upto )?\$[\d,]+K?|(?:Up to |Upto )?[\d,]+ ETH|Variable|No Limit/i);
          return match ? match[0] : 'Not specified';
        });
        
        // Extract deadline from the card
        const deadline = await card.evaluate(el => {
          const text = el.textContent;
          const match = text.match(/Jan \d+|Feb \d+|Mar \d+|Apr \d+|May \d+|Jun \d+|Jul \d+|Aug \d+|Sep \d+|Oct \d+|Nov \d+|Dec \d+/);
          return match ? match[0] : 'Not specified';
        });
        
        // Extract a short description from the card
        const description = await card.evaluate(el => {
          const text = el.textContent.trim();
          // Remove the title from the text
          const titleEl = el.querySelector('h2, h3, h4');
          const title = titleEl ? titleEl.textContent.trim() : '';
          let desc = text;
          if (title) {
            desc = text.replace(title, '').trim();
          }
          // Clean up the description
          desc = desc.replace(/Jan \d+|Feb \d+|Mar \d+|Apr \d+|May \d+|Jun \d+|Jul \d+|Aug \d+|Sep \d+|Oct \d+|Nov \d+|Dec \d+/, '').trim();
          return desc;
        });
        
        if (title && link && link.includes('blockchaingrants.org')) {
          grantsBasicInfo.push({ 
            title, 
            link,
            initialAmount: amount,
            initialDeadline: deadline,
            initialDescription: description
          });
          console.log(`Found grant: ${title} - ${link}`);
          console.log(`  Initial amount: ${amount}`);
          console.log(`  Initial deadline: ${deadline}`);
          console.log(`  Initial description: ${description.substring(0, 100)}...`);
        }
      } catch (error) {
        console.error(`Error processing card ${i + 1}:`, error.message);
      }
    }
    
    console.log(`Found ${grantsBasicInfo.length} grants to process in detail`);
    
    // Visit each grant page to extract detailed information
    const detailedGrants = [];
    for (let i = 0; i < grantsBasicInfo.length; i++) {
      const { title, link, initialAmount, initialDeadline, initialDescription } = grantsBasicInfo[i];
      console.log(`Processing grant ${i + 1}/${grantsBasicInfo.length}: ${title}`);
      
      try {
        // Navigate to the grant page
        await page.goto(link, { timeout: 60000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
        
        // Take a screenshot of the grant page
        await page.screenshot({ path: `grant_${i + 1}.png` });
        
        // Extract detailed information - pass initial values as a single object
        const detailedInfo = await page.evaluate(({ initialAmount, initialDeadline, initialDescription }) => {
          // Helper function to clean text
          const cleanText = (text) => {
            if (!text) return '';
            return text.replace(/\s+/g, ' ').trim();
          };
          
          // Extract amount - try to find it in specific elements first
          let amount = initialAmount;
          if (amount === 'Not specified') {
            // Look for amount in specific elements that might contain it
            const fundingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, div'));
            for (const el of fundingElements) {
              const text = el.textContent.toLowerCase();
              if (text.includes('funding') || text.includes('grant') || text.includes('award') || 
                  text.includes('amount') || text.includes('budget') || text.includes('$') || 
                  text.includes('usd') || text.includes('eth')) {
                const match = text.match(/(?:up to |upto )?\$[\d,]+K?|(?:up to |upto )?[\d,]+ ETH|variable|no limit/i);
                if (match) {
                  amount = match[0];
                  break;
                }
              }
            }
          }
          
          // Extract deadline - try to find it in specific elements first
          let deadline = initialDeadline;
          if (deadline === 'Not specified') {
            // Look for deadline in specific elements that might contain it
            const dateElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, div'));
            for (const el of dateElements) {
              const text = el.textContent.toLowerCase();
              if (text.includes('deadline') || text.includes('due') || text.includes('date') || 
                  text.includes('submission') || text.includes('apply by')) {
                const match = text.match(/jan \d+|feb \d+|mar \d+|apr \d+|may \d+|jun \d+|jul \d+|aug \d+|sep \d+|oct \d+|nov \d+|dec \d+|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/i);
                if (match) {
                  deadline = match[0];
                  break;
                }
              }
            }
          }
          
          // Use the initial description if we can't extract a better one
          let description = initialDescription;
          
          // Try to extract a better description from the page
          const paragraphs = Array.from(document.querySelectorAll('p'));
          const relevantParagraphs = paragraphs.filter(p => {
            const text = p.textContent.trim();
            return text.length > 50 && 
                  !text.includes('Join the Fam') && 
                  !text.includes('Made with') &&
                  !text.includes('Copyright') &&
                  !text.includes('Privacy Policy');
          });
          
          if (relevantParagraphs.length > 0) {
            // Combine the first few paragraphs for a better description
            const descTexts = relevantParagraphs.slice(0, 3).map(p => p.textContent.trim());
            description = descTexts.join('\n\n');
          }
          
          // If we still don't have a good description, try to extract it from the main content
          if (description.length < 100) {
            const mainContent = document.querySelector('main');
            if (mainContent) {
              const text = mainContent.textContent.trim();
              // Remove common elements that are not part of the description
              const cleanedText = text
                .replace(/Join the Fam!.*$/s, '')
                .replace(/Made with.*$/s, '')
                .replace(/Copyright.*$/s, '')
                .replace(/Privacy Policy.*$/s, '');
              
              if (cleanedText.length > 100) {
                description = cleanedText;
              }
            }
          }
          
          // Extract categories/tags
          const categories = [];
          const categoryElements = Array.from(document.querySelectorAll('a[href*="/blockchain"], a[href*="/bitcoin"], a[href*="/defi"]'));
          for (const el of categoryElements) {
            const category = el.textContent.trim();
            if (category && !categories.includes(category) && category !== 'Made with') {
              categories.push(category);
            }
          }
          
          // Extract application URL if available
          let applicationUrl = '';
          const links = Array.from(document.querySelectorAll('a'));
          for (const link of links) {
            const text = link.textContent.toLowerCase();
            const href = link.href;
            if ((text.includes('apply') || text.includes('submit') || text.includes('application')) && 
                href && href !== window.location.href) {
              applicationUrl = href;
              break;
            }
          }
          
          return {
            amount,
            deadline,
            description,
            categories: categories.length > 0 ? categories : ['Blockchain'],
            applicationUrl,
            url: window.location.href
          };
        }, { initialAmount, initialDeadline, initialDescription });
        
        // Create complete grant object
        const grant = {
          title,
          amount: detailedInfo.amount,
          deadline: detailedInfo.deadline,
          description: detailedInfo.description,
          categories: detailedInfo.categories,
          applicationUrl: detailedInfo.applicationUrl || null,
          link
        };
        
        console.log(`Extracted detailed info for: ${title}`);
        console.log(`  Amount: ${grant.amount}`);
        console.log(`  Deadline: ${grant.deadline}`);
        console.log(`  Categories: ${grant.categories.join(', ')}`);
        console.log(`  Description length: ${grant.description.length} characters`);
        if (grant.applicationUrl) {
          console.log(`  Application URL: ${grant.applicationUrl}`);
        }
        
        detailedGrants.push(grant);
        
        // Wait a bit between requests to avoid overloading the server
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing grant page for ${title}:`, error.message);
        // Add basic info even if detailed scraping failed
        detailedGrants.push({
          title,
          amount: initialAmount,
          deadline: initialDeadline,
          description: initialDescription || 'Failed to extract detailed information',
          categories: ['Blockchain'],
          link
        });
      }
    }
    
    // Save to local file
    await fs.writeFile('detailed_grants.json', JSON.stringify(detailedGrants, null, 2));
    console.log(`Scraped and saved ${detailedGrants.length} detailed grants`);
    
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

scrapeBlockchainGrants().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
});
