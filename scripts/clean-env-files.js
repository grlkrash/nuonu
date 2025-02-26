const fs = require('fs');
const path = require('path');

/**
 * This script creates sanitized versions of environment files
 * by removing sensitive information like API keys and private keys.
 */

// Define the sensitive keys that should be sanitized
const sensitiveKeys = [
  'OPENAI_API_KEY',
  'GROK_API_KEY',
  'PRIVATE_KEY',
  'SUPABASE_SERVICE_KEY',
  'COINBASE_API_KEY',
  'COINBASE_API_KEY_PRIVATE',
  'ETHERSCAN_API_KEY',
  'BASESCAN_API_KEY',
  'ZKSYNC_SESSION_KEY'
];

// Function to sanitize a .env file
function sanitizeEnvFile(inputPath, outputPath) {
  console.log(`Sanitizing ${inputPath} to ${outputPath}...`);
  
  try {
    // Read the input file
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // Split into lines
    const lines = content.split('\n');
    
    // Process each line
    const sanitizedLines = lines.map(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') {
        return line;
      }
      
      // Check if the line contains a sensitive key
      const [key] = line.split('=');
      const trimmedKey = key ? key.trim() : '';
      
      if (sensitiveKeys.some(sensitiveKey => trimmedKey === sensitiveKey)) {
        // Replace the value with a placeholder
        return `${trimmedKey}=your_${trimmedKey.toLowerCase()}_here`;
      }
      
      return line;
    });
    
    // Write the sanitized content to the output file
    fs.writeFileSync(outputPath, sanitizedLines.join('\n'));
    console.log(`✅ Successfully sanitized ${inputPath} to ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error sanitizing ${inputPath}: ${error.message}`);
  }
}

// Main function
function main() {
  console.log('Starting environment file sanitization...');
  
  // Sanitize .env.local to .env.example
  sanitizeEnvFile(
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env.example')
  );
  
  // Create a clean version of .env.contracts if it exists
  const envContractsPath = path.join(__dirname, '..', '.env.contracts');
  if (fs.existsSync(envContractsPath)) {
    sanitizeEnvFile(
      envContractsPath,
      path.join(__dirname, '..', '.env.contracts.example')
    );
  }
  
  console.log('Environment file sanitization completed.');
}

// Run the main function
main(); 