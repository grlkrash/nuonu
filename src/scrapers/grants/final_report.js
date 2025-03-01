const fs = require('fs').promises;

// Configuration
const ENHANCED_GRANTS_FILE = 'enhanced_grants.json';
const FINAL_REPORT_FILE = 'final_grants_report.json';

async function generateFinalReport() {
  try {
    // Read the enhanced grants data
    const grantsData = JSON.parse(await fs.readFile(ENHANCED_GRANTS_FILE, 'utf8'));
    console.log(`Read ${grantsData.length} grants from ${ENHANCED_GRANTS_FILE}`);
    
    // Generate statistics
    const stats = {
      totalGrants: grantsData.length,
      averageDescriptionLength: 0,
      categoryCounts: {},
      amountRanges: {
        unknown: 0,
        lessThan10k: 0,
        between10kAnd50k: 0,
        between50kAnd100k: 0,
        between100kAnd250k: 0,
        moreThan250k: 0
      }
    };
    
    // Process each grant
    let totalDescriptionLength = 0;
    
    for (const grant of grantsData) {
      // Count description length
      totalDescriptionLength += grant.description ? grant.description.length : 0;
      
      // Count categories
      if (grant.categories && Array.isArray(grant.categories)) {
        grant.categories.forEach(category => {
          stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
        });
      }
      
      // Categorize by amount
      const amount = grant.amount ? grant.amount.toLowerCase() : '';
      
      if (!amount || amount.includes('unknown')) {
        stats.amountRanges.unknown++;
      } else if (amount.includes('$1') || amount.includes('1 eth') || amount.match(/\b[1-9]\b/)) {
        stats.amountRanges.lessThan10k++;
      } else if (amount.includes('10k') || amount.match(/\$\s*\d{1,4}[,\.]?\d{0,3}/)) {
        stats.amountRanges.lessThan10k++;
      } else if (amount.includes('50k') || amount.match(/\$\s*[1-4][0-9][,\.]?\d{3}/)) {
        stats.amountRanges.between10kAnd50k++;
      } else if (amount.includes('100k') || amount.match(/\$\s*[5-9][0-9][,\.]?\d{3}/)) {
        stats.amountRanges.between50kAnd100k++;
      } else if (amount.includes('250k') || amount.match(/\$\s*[1-2][0-9]{2}[,\.]?\d{3}/)) {
        stats.amountRanges.between100kAnd250k++;
      } else if (amount.includes('m') || amount.match(/\$\s*[3-9][0-9]{2}[,\.]?\d{3}/) || amount.match(/million/i)) {
        stats.amountRanges.moreThan250k++;
      } else {
        stats.amountRanges.unknown++;
      }
    }
    
    // Calculate average description length
    stats.averageDescriptionLength = Math.round(totalDescriptionLength / grantsData.length);
    
    // Create the final report
    const finalReport = {
      timestamp: new Date().toISOString(),
      stats,
      grants: grantsData
    };
    
    // Save the final report
    await fs.writeFile(FINAL_REPORT_FILE, JSON.stringify(finalReport, null, 2));
    console.log(`Saved final report to ${FINAL_REPORT_FILE}`);
    
    // Print summary
    console.log('\nSummary:');
    console.log(`Total grants: ${stats.totalGrants}`);
    console.log(`Average description length: ${stats.averageDescriptionLength} characters`);
    console.log('\nCategories:');
    Object.entries(stats.categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} grants`);
    });
    console.log('\nAmount ranges:');
    Object.entries(stats.amountRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} grants`);
    });
    
  } catch (error) {
    console.error('Error generating final report:', error);
  }
}

// Run the report generator
generateFinalReport().catch(error => {
  console.error('Main process error:', error);
  process.exit(1);
}); 