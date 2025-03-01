/**
 * Script to create a JSON file with the API key for testing
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

function main() {
  console.log('Creating API key JSON file for testing...');
  
  // Check for required environment variables
  const apiKeyName = process.env.COINBASE_API_KEY;
  const apiKeyPrivateKey = process.env.COINBASE_API_SECRET;
  
  if (!apiKeyName || !apiKeyPrivateKey) {
    console.error('Missing Coinbase credentials. Please set COINBASE_API_KEY and COINBASE_API_SECRET environment variables.');
    process.exit(1);
  }
  
  // Create the API key JSON object
  const apiKeyJson = {
    name: apiKeyName,
    private_key: apiKeyPrivateKey.replace(/\\n/g, '\n')
  };
  
  // Write the JSON file
  const filePath = path.resolve(process.cwd(), 'api-key.json');
  fs.writeFileSync(filePath, JSON.stringify(apiKeyJson, null, 2));
  
  console.log(`API key JSON file created at: ${filePath}`);
}

main(); 