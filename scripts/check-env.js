/**
 * Simple script to check environment variables
 */

require('dotenv').config({ path: '.env.local' });

function main() {
  console.log('Checking environment variables...');
  
  // Check for CDP API keys
  const cdpApiKeyName = process.env.CDP_API_KEY_NAME;
  const cdpApiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;
  
  // Check for Coinbase API keys
  const coinbaseApiKey = process.env.COINBASE_API_KEY;
  const coinbaseApiSecret = process.env.COINBASE_API_SECRET;
  
  // Check for network ID
  const networkId = process.env.NETWORK_ID;
  
  console.log('CDP_API_KEY_NAME:', cdpApiKeyName ? `${cdpApiKeyName.substring(0, 5)}...${cdpApiKeyName.substring(cdpApiKeyName.length - 5)}` : 'Not set');
  console.log('CDP_API_KEY_PRIVATE_KEY length:', cdpApiKeyPrivateKey ? cdpApiKeyPrivateKey.length : 'Not set');
  
  if (cdpApiKeyPrivateKey) {
    console.log('CDP_API_KEY_PRIVATE_KEY format check:');
    console.log('- Starts with "-----BEGIN EC PRIVATE KEY-----":', cdpApiKeyPrivateKey.includes('-----BEGIN EC PRIVATE KEY-----'));
    console.log('- Ends with "-----END EC PRIVATE KEY-----":', cdpApiKeyPrivateKey.includes('-----END EC PRIVATE KEY-----'));
    console.log('- Contains newlines:', cdpApiKeyPrivateKey.includes('\n'));
    
    // Print the first and last 10 characters
    console.log('- First 10 characters:', cdpApiKeyPrivateKey.substring(0, 10));
    console.log('- Last 10 characters:', cdpApiKeyPrivateKey.substring(cdpApiKeyPrivateKey.length - 10));
  }
  
  console.log('COINBASE_API_KEY:', coinbaseApiKey ? `${coinbaseApiKey.substring(0, 5)}...${coinbaseApiKey.substring(coinbaseApiKey.length - 5)}` : 'Not set');
  console.log('COINBASE_API_SECRET length:', coinbaseApiSecret ? coinbaseApiSecret.length : 'Not set');
  console.log('NETWORK_ID:', networkId || 'Not set');
  
  console.log('Environment check completed.');
}

main(); 