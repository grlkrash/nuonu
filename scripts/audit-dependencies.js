#!/usr/bin/env node

/**
 * Dependency Audit and Update Script
 * 
 * This script performs the following tasks:
 * 1. Runs npm audit to check for vulnerabilities
 * 2. Generates a report of outdated dependencies
 * 3. Optionally updates dependencies based on specified criteria
 * 4. Logs all actions to a dependency audit log
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  logDir: path.join(__dirname, '../logs'),
  logFile: 'dependency-audit.log',
  packageJson: path.join(__dirname, '../package.json'),
  updateLevel: 'minor', // 'patch', 'minor', or 'major'
  autoFix: false, // Set to true to automatically fix vulnerabilities
  excludePackages: [], // Packages to exclude from updates
};

// Ensure log directory exists
if (!fs.existsSync(CONFIG.logDir)) {
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// Logger
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(path.join(CONFIG.logDir, CONFIG.logFile), logMessage + '\n');
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
    fs.appendFileSync(path.join(CONFIG.logDir, CONFIG.logFile), logMessage + '\n');
  }
};

// Run command and return output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    if (error.stdout) return error.stdout;
    logger.error(`Command failed: ${command}`);
    logger.error(error.message);
    return null;
  }
}

// Parse package.json
function getPackageJson() {
  try {
    const packageJsonContent = fs.readFileSync(CONFIG.packageJson, 'utf8');
    return JSON.parse(packageJsonContent);
  } catch (error) {
    logger.error(`Failed to parse package.json: ${error.message}`);
    return null;
  }
}

// Run npm audit
function runAudit() {
  logger.log('Running npm audit...');
  const auditOutput = runCommand('npm audit --json');
  
  if (!auditOutput) {
    logger.error('Audit failed');
    return { vulnerabilities: 0, details: [] };
  }
  
  try {
    const auditData = JSON.parse(auditOutput);
    const vulnerabilityCount = 
      (auditData.metadata?.vulnerabilities?.low || 0) +
      (auditData.metadata?.vulnerabilities?.moderate || 0) +
      (auditData.metadata?.vulnerabilities?.high || 0) +
      (auditData.metadata?.vulnerabilities?.critical || 0);
    
    logger.log(`Found ${vulnerabilityCount} vulnerabilities`);
    
    // Extract vulnerability details
    const details = [];
    if (auditData.vulnerabilities) {
      Object.keys(auditData.vulnerabilities).forEach(key => {
        const vuln = auditData.vulnerabilities[key];
        details.push({
          name: key,
          severity: vuln.severity,
          via: Array.isArray(vuln.via) ? vuln.via.map(v => typeof v === 'string' ? v : v.name).join(', ') : vuln.via,
          fixAvailable: vuln.fixAvailable
        });
      });
    }
    
    return { vulnerabilities: vulnerabilityCount, details };
  } catch (error) {
    logger.error(`Failed to parse audit output: ${error.message}`);
    return { vulnerabilities: 0, details: [] };
  }
}

// Fix vulnerabilities
function fixVulnerabilities() {
  logger.log('Attempting to fix vulnerabilities...');
  const fixOutput = runCommand('npm audit fix --force');
  logger.log(fixOutput || 'No output from fix command');
}

// Check for outdated packages
function checkOutdated() {
  logger.log('Checking for outdated packages...');
  const outdatedOutput = runCommand('npm outdated --json');
  
  if (!outdatedOutput) {
    logger.error('Outdated check failed');
    return [];
  }
  
  try {
    const outdatedData = JSON.parse(outdatedOutput);
    const outdatedPackages = Object.keys(outdatedData).map(key => {
      const pkg = outdatedData[key];
      return {
        name: key,
        current: pkg.current,
        wanted: pkg.wanted,
        latest: pkg.latest,
        type: pkg.type,
        updateType: getUpdateType(pkg.current, pkg.latest)
      };
    });
    
    logger.log(`Found ${outdatedPackages.length} outdated packages`);
    return outdatedPackages;
  } catch (error) {
    logger.error(`Failed to parse outdated output: ${error.message}`);
    return [];
  }
}

// Determine update type (patch, minor, major)
function getUpdateType(current, latest) {
  if (!current || !latest) return 'unknown';
  
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  return 'patch';
}

// Update packages based on criteria
function updatePackages(outdatedPackages) {
  const packagesToUpdate = outdatedPackages.filter(pkg => {
    // Skip excluded packages
    if (CONFIG.excludePackages.includes(pkg.name)) return false;
    
    // Update based on update level
    switch (CONFIG.updateLevel) {
      case 'patch':
        return pkg.updateType === 'patch';
      case 'minor':
        return ['patch', 'minor'].includes(pkg.updateType);
      case 'major':
        return true;
      default:
        return false;
    }
  });
  
  if (packagesToUpdate.length === 0) {
    logger.log('No packages to update based on current criteria');
    return;
  }
  
  logger.log(`Updating ${packagesToUpdate.length} packages...`);
  
  packagesToUpdate.forEach(pkg => {
    logger.log(`Updating ${pkg.name} from ${pkg.current} to ${pkg.wanted}`);
    const updateOutput = runCommand(`npm install ${pkg.name}@${pkg.wanted}`);
    logger.log(`Update result for ${pkg.name}: ${updateOutput ? 'Success' : 'Failed'}`);
  });
}

// Generate report
function generateReport(auditResults, outdatedPackages) {
  const reportPath = path.join(CONFIG.logDir, 'dependency-report.md');
  const timestamp = new Date().toISOString();
  
  let report = `# Dependency Audit Report\n\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  // Vulnerability section
  report += `## Security Vulnerabilities\n\n`;
  report += `Total vulnerabilities found: ${auditResults.vulnerabilities}\n\n`;
  
  if (auditResults.details.length > 0) {
    report += `| Package | Severity | Via | Fix Available |\n`;
    report += `|---------|----------|-----|---------------|\n`;
    
    auditResults.details.forEach(vuln => {
      report += `| ${vuln.name} | ${vuln.severity} | ${vuln.via} | ${vuln.fixAvailable ? 'Yes' : 'No'} |\n`;
    });
  } else {
    report += `No vulnerability details available.\n`;
  }
  
  // Outdated packages section
  report += `\n## Outdated Packages\n\n`;
  report += `Total outdated packages: ${outdatedPackages.length}\n\n`;
  
  if (outdatedPackages.length > 0) {
    report += `| Package | Current | Wanted | Latest | Update Type |\n`;
    report += `|---------|---------|--------|--------|--------------|\n`;
    
    outdatedPackages.forEach(pkg => {
      report += `| ${pkg.name} | ${pkg.current} | ${pkg.wanted} | ${pkg.latest} | ${pkg.updateType} |\n`;
    });
  } else {
    report += `No outdated packages found.\n`;
  }
  
  // Write report to file
  fs.writeFileSync(reportPath, report);
  logger.log(`Report generated at ${reportPath}`);
}

// Interactive mode
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise(resolve => rl.question(query, resolve));
  
  try {
    const updateLevel = await question('Update level (patch/minor/major): ');
    if (['patch', 'minor', 'major'].includes(updateLevel)) {
      CONFIG.updateLevel = updateLevel;
    }
    
    const autoFix = await question('Automatically fix vulnerabilities? (y/n): ');
    CONFIG.autoFix = autoFix.toLowerCase() === 'y';
    
    const excludeInput = await question('Packages to exclude (comma-separated): ');
    if (excludeInput.trim()) {
      CONFIG.excludePackages = excludeInput.split(',').map(p => p.trim());
    }
    
    rl.close();
  } catch (error) {
    logger.error(`Interactive mode error: ${error.message}`);
    rl.close();
  }
}

// Main function
async function main() {
  logger.log('Starting dependency audit and update');
  
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive') || args.includes('-i');
  
  if (interactive) {
    await interactiveMode();
  }
  
  // Get package.json
  const packageJson = getPackageJson();
  if (!packageJson) {
    logger.error('Cannot proceed without valid package.json');
    return;
  }
  
  // Run audit
  const auditResults = runAudit();
  
  // Fix vulnerabilities if configured
  if (CONFIG.autoFix && auditResults.vulnerabilities > 0) {
    fixVulnerabilities();
  }
  
  // Check outdated packages
  const outdatedPackages = checkOutdated();
  
  // Update packages based on criteria
  if (outdatedPackages.length > 0) {
    updatePackages(outdatedPackages);
  }
  
  // Generate report
  generateReport(auditResults, outdatedPackages);
  
  logger.log('Dependency audit and update completed');
}

// Run the script
main().catch(error => {
  logger.error(`Script failed: ${error.message}`);
}); 