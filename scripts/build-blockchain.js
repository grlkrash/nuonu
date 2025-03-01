#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directories to compile
const DIRS_TO_COMPILE = [
  'src/lib/blockchain',
  'src/lib/agent',
  'src/lib/env.ts'
];

// Output directory
const OUTPUT_DIR = 'dist';

function main() {
  console.log('Building blockchain components...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Create lib directory if it doesn't exist
  if (!fs.existsSync(path.join(OUTPUT_DIR, 'lib'))) {
    fs.mkdirSync(path.join(OUTPUT_DIR, 'lib'), { recursive: true });
  }
  
  // Create blockchain directory if it doesn't exist
  if (!fs.existsSync(path.join(OUTPUT_DIR, 'lib/blockchain'))) {
    fs.mkdirSync(path.join(OUTPUT_DIR, 'lib/blockchain'), { recursive: true });
  }
  
  // Create agent directory if it doesn't exist
  if (!fs.existsSync(path.join(OUTPUT_DIR, 'lib/agent'))) {
    fs.mkdirSync(path.join(OUTPUT_DIR, 'lib/agent'), { recursive: true });
  }
  
  // Copy env.ts
  console.log('Copying env.ts...');
  fs.copyFileSync(
    path.join('src/lib/env.ts'),
    path.join(OUTPUT_DIR, 'lib/env.js')
  );
  
  // Replace TypeScript imports with JavaScript imports in env.js
  let envContent = fs.readFileSync(path.join(OUTPUT_DIR, 'lib/env.js'), 'utf8');
  envContent = envContent.replace(/\.ts/g, '.js');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'lib/env.js'), envContent);
  
  // Copy action providers
  console.log('Copying action providers...');
  copyDir(
    path.join('src/lib/blockchain/action-providers'),
    path.join(OUTPUT_DIR, 'lib/blockchain/action-providers')
  );
  
  // Copy agent files
  console.log('Copying agent files...');
  copyDir(
    path.join('src/lib/agent'),
    path.join(OUTPUT_DIR, 'lib/agent')
  );
  
  // Copy cdp-wallet.ts
  console.log('Copying cdp-wallet.ts...');
  fs.copyFileSync(
    path.join('src/lib/blockchain/cdp-wallet.ts'),
    path.join(OUTPUT_DIR, 'lib/blockchain/cdp-wallet.js')
  );
  
  // Copy agent.ts
  console.log('Copying agent.ts...');
  fs.copyFileSync(
    path.join('src/lib/blockchain/agent.ts'),
    path.join(OUTPUT_DIR, 'lib/blockchain/agent.js')
  );
  
  // Replace TypeScript imports with JavaScript imports
  replaceImports(path.join(OUTPUT_DIR, 'lib'));
  
  console.log('Build completed successfully!');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name.replace('.ts', '.js'));
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function replaceImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      replaceImports(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      let content = fs.readFileSync(entryPath, 'utf8');
      content = content.replace(/\.ts/g, '.js');
      fs.writeFileSync(entryPath, content);
    }
  }
}

main(); 