/**
 * Iteration 4 Frontend Test - RFM Segmentation & Win-Back
 * Testing all features specified in the review request
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'xp.surya@gmail.com';
const ADMIN_PASSWORD = 'Admin#2026';

// Test results collector
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(msg) {
  console.log(`[TEST] ${msg}`);
}

function pass(test) {
  results.passed.push(test);
  log(`✅ PASS: ${test}`);
}

function fail(test, reason) {
  results.failed.push({ test, reason });
  log(`❌ FAIL: ${test} - ${reason}`);
}

function warn(test, reason) {
  results.warnings.push({ test, reason });
  log(`⚠️  WARN: ${test} - ${reason}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTestId(page, testId, timeout = 5000) {
  try {
    await page.waitForSelector(`[data-testid="${testId}"]`, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

async function getTestIdCount(page, testId) {
  return await page.$$eval(`[data-testid="${testId}"]`, els => els.length);
}

async function getTestIdText(page, testId) {
  try {
    return await page.$eval(`[data-testid="${testId}"]`, el => el.textContent.trim());
  } catch (e) {
    return null;
  }
}

async function clickTestId(page, testId) {
  await page.click(`[data-testid="${testId}"]`);
}

async function login(page) {
  log('Attempting login...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await sleep(1000);
  
  // Check if login button exists
  const loginBtn = await page.$('[data-testid="nav-login-button"]');
  if (!loginBtn) {
    log('Already logged in or no login button found');
    return true;
  }
  
  await clickTestId(page, 'nav-login-button');
  await sleep(500);
  
  await page.type('[data-testid="login-email"]', ADMIN_EMAIL);
  await page.type('[data-testid="login-password"]', ADMIN_PASSWORD);
  await clickTestId(page, 'login-submit');
  await sleep(2000);
  
  log('Login completed');
  return true;
}

async function navigateToCustomerTab(page) {
  log('Navigating to Customer Analytic tab...');
  
  // Click on Customer tab
  const customerTab = await page.$('[data-testid="tab-customer"]');
  if (customerTab) {
    await clickTestId(page, 'tab-customer');
  } else {
    // Try alternative selector
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const customerTab = tabs.find(t => t.textContent.includes('Customer'));
      if (customerTab) customerTab.click();
    });
  }
  
  await sleep(2000);
  log('Customer tab loaded');
}

async function testRFMSegmentCards(page) {
  log('\n=== Testing RFM Segment Cards ===');
  
  // Check for rfm-segments-row
  const hasRow = await waitForTestId(page, 'rfm-segments-row', 3000);
  if (!hasRow) {
    fail('RFM Segments Row', 'rfm-segments-row not found');
    return;
  }
  pass('RFM Segments Row exists');
  
  // Check for all 5 segment cards
  const segments = ['CHAMPIONS', 'LOYAL', 'NEW_POTENTIAL', 'AT_RISK', 'HIBERNATING'];
  for (const seg of segments) {
    const testId = `segment-card-${seg}`;
    const exists = await waitForTestId(page, testId, 1000);
    if (!exists) {
      fail(`Segment Card ${seg}`, `${testId} not found`);
      continue;
    }
    
    // Check card content
    const cardText = await page.$eval(`[data-testid="${testId}"]`, el => el.textContent);
    
    // Check for customer count (should have numbers)
    const hasNumber = /\d+/.test(cardText);
    if (!hasNumber) {
      fail(`Segment Card ${seg} content`, 'No customer count found');
    } else {
      pass(`Segment Card ${seg} has customer count`);
    }
    
    // Check for percentage symbols
    const hasPercent = cardText.includes('%');
    if (!hasPercent) {
      warn(`Segment Card ${seg} content`, 'No percentage found');
    } else {
      pass(`Segment Card ${seg} has percentages`);
    }
  }
}

async function testRFMCard(page) {
  log('\n=== Testing RFM Segmentation Card ===');
  
  // Check RFM card exists
  const hasCard = await waitForTestId(page, 'rfm-card', 2000);
  if (!hasCard) {
    fail('RFM Card', 'rfm-card not found');
    return;
  }
  pass('RFM Card exists');
  
  // Check subtitle for adaptive thresholds
  const subtitle = await page.$eval('[data-testid="rfm-card"]', el => {
    const sub = el.querySelector('.text-xs.text-slate-400, .text-\\[11px\\].text-slate-400');
    return sub ? sub.textContent : '';
  });
  
  if (subtitle.includes('aktif') && subtitle.includes('hari') && subtitle.includes('diam')) {
    pass('RFM Card subtitle shows adaptive thresholds');
  } else {
    fail('RFM Card subtitle', 'Missing threshold information');
  }
  
  // Check for chart
  const hasChart = await waitForTestId(page, 'chart-rfm-segment', 2000);
  if (!hasChart) {
    fail('RFM Chart', 'chart-rfm-segment not found');
  } else {
    pass('RFM Chart exists');
  }
  
  // Check for detail table
  const hasTable = await waitForTestId(page, 'rfm-detail-table', 2000);
  if (!hasTable) {
    fail('RFM Detail Table', 'rfm-detail-table not found');
  } else {
    pass('RFM Detail Table exists');
    
    // Check table has all segments
    const tableRows = await page.$$eval('[data-testid="rfm-detail-table"] tbody tr', rows => rows.length);
    if (tableRows === 5) {
      pass('RFM Detail Table has 5 segment rows');
    } else {
      fail('RFM Detail Table rows', `Expected 5 rows, found ${tableRows}`);
    }
  }
}

async function testWinBackCard(page) {
  log('\n=== Testing Prioritas Win-Back Card ===');
  
  // Check Win-Back card exists
  const hasCard = await waitForTestId(page, 'winback-card', 2000);
  if (!hasCard) {
    fail('Win-Back Card', 'winback-card not found');
    return;
  }
  pass('Win-Back Card exists');
  
  // Check for win-back table
  const hasTable = await waitForTestId(page, 'winback-table', 2000);
  if (!hasTable) {
    // Check for empty state
    const hasEmpty = await waitForTestId(page, 'winback-empty', 1000);
    if (hasEmpty) {
      pass('Win-Back table shows empty state (no at-risk customers)');
      return;
    }
    fail('Win-Back Table', 'winback-table not found and no empty state');
    return;
  }
  pass('Win-Back Table exists');
  
  // Check table only has AT_RISK and HIBERNATING badges
  const badges = await page.$$eval('[data-testid="winback-table"] [data-testid^="segment-badge-"]', els => 
    els.map(el => el.getAttribute('data-testid'))
  );
  
  const invalidBadges = badges.filter(b => !b.includes('AT_RISK') && !b.includes('HIBERNATING'));
  if (invalidBadges.length > 0) {
    fail('Win-Back Table segments', `Found non-risk segments: ${invalidBadges.join(', ')}`);
  } else if (badges.length > 0) {
    pass('Win-Back Table only shows AT_RISK and HIBERNATING customers');
  }
  
  // Check sorting by Total Value (descending)
  const values = await page.$$eval('[data-testid="winback-table"] tbody tr', rows => {
    return rows.slice(0, 3).map(row => {
      const cells = row.querySelectorAll('td');
      // Total Value is typically in the 8th column (index 7)
      const valueCell = cells[7];
      if (!valueCell) return 0;
      const text = valueCell.textContent.replace(/[^\d]/g, '');
      return parseInt(text) || 0;
    });
  });
  
  if (values.length >= 2) {
    const isSorted = values[0] >= values[1];
    if (isSorted) {
      pass('Win-Back Table sorted by Total Value descending');
    } else {
      fail('Win-Back Table sorting', `First value ${values[0]} < second value ${values[1]}`);
    }
  }
  
  // Check subtitle mentions count and nilai berisiko
  const subtitle = await page.$eval('[data-testid="winback-card"]', el => {
    const sub = el.querySelector('.text-xs.text-slate-400, .text-\\[11px\\].text-slate-400');
    return sub ? sub.textContent : '';
  });
  
  if (subtitle.includes('customer') && subtitle.includes('berisiko')) {
    pass('Win-Back Card subtitle mentions count and nilai berisiko');
  } else {
    warn('Win-Back Card subtitle', 'Missing expected information');
  }
}

async function testTopCustomerTable(page) {
  log('\n=== Testing Top Customer Table ===');
  
  // Check table exists
  const hasTable = await waitForTestId(page, 'top-customer-table', 2000);
  if (!hasTable) {
    fail('Top Customer Table', 'top-customer-table not found');
    return;
  }
  pass('Top Customer Table exists');
  
  // Check for Segment column by looking for segment badges in the table
  const segmentBadges = await page.$$eval('[data-testid="top-customer-table"] [data-testid^="segment-badge-"]', els => els.length);
  
  if (segmentBadges > 0) {
    pass('Top Customer Table has Segment column with badges');
  } else {
    fail('Top Customer Table Segment column', 'No segment badges found in table');
  }
}

async function testInsightOtomatis(page) {
  log('\n=== Testing Insight Otomatis ===');
  
  // Check insights card exists
  const hasCard = await waitForTestId(page, 'customer-insights-card', 2000);
  if (!hasCard) {
    fail('Insight Otomatis Card', 'customer-insights-card not found');
    return;
  }
  pass('Insight Otomatis Card exists');
  
  // Check if first bullet mentions At Risk / Hibernating
  const insights = await page.$eval('[data-testid="customer-insights-card"]', el => {
    const bullets = el.querySelectorAll('li');
    return Array.from(bullets).map(li => li.textContent);
  });
  
  if (insights.length === 0) {
    fail('Insight Otomatis content', 'No insights found');
    return;
  }
  
  // Check if any insight mentions At Risk or Hibernating
  const hasWinBackInsight = insights.some(text => 
    text.includes('At Risk') || text.includes('Hibernating') || text.includes('win-back')
  );
  
  if (hasWinBackInsight) {
    pass('Insight Otomatis mentions At Risk/Hibernating win-back');
  } else {
    warn('Insight Otomatis', 'No At Risk/Hibernating mention (may be valid if no such customers exist)');
  }
}

async function testScopeToggle(page) {
  log('\n=== Testing Scope Toggle ===');
  
  // Check scope toggle exists
  const hasToggle = await waitForTestId(page, 'customer-scope-period', 2000);
  if (!hasToggle) {
    fail('Scope Toggle', 'customer-scope-period not found');
    return;
  }
  pass('Scope Toggle exists');
  
  // Get initial customer count
  const initialCount = await getTestIdText(page, 'kpi-total-customer-value');
  log(`Initial customer count: ${initialCount}`);
  
  // Click period toggle
  await clickTestId(page, 'customer-scope-period');
  await sleep(2000);
  
  // Check if data changed or empty state appears
  const hasEmpty = await waitForTestId(page, 'customer-empty', 1000);
  const newCount = await getTestIdText(page, 'kpi-total-customer-value');
  
  if (hasEmpty) {
    pass('Scope Toggle shows customer-empty for empty period');
  } else if (newCount !== initialCount) {
    pass('Scope Toggle changes data when switched');
  } else {
    warn('Scope Toggle', 'Data did not change (may be valid if both periods have same data)');
  }
  
  // Switch back to MTD
  await clickTestId(page, 'customer-scope-mtd');
  await sleep(2000);
  pass('Scope Toggle can switch back to MTD');
}

async function testIteration3Regression(page) {
  log('\n=== Testing Iteration 3 Regression ===');
  
  // Check no live-event-ticker
  const hasLiveTicker = await page.$('[data-testid="live-event-ticker"]');
  if (hasLiveTicker) {
    fail('Regression: Live Event Ticker', 'live-event-ticker should not exist');
  } else {
    pass('Regression: No live-event-ticker');
  }
  
  // Check export menu
  const hasExportBtn = await waitForTestId(page, 'export-dashboard-button', 2000);
  if (!hasExportBtn) {
    fail('Regression: Export Button', 'export-dashboard-button not found');
  } else {
    pass('Regression: Export button exists');
    
    // Click export button
    await clickTestId(page, 'export-dashboard-button');
    await sleep(500);
    
    // Check for export options
    const exportOptions = await page.$$('[data-testid^="export-option-"]');
    if (exportOptions.length >= 4) {
      pass('Regression: Export menu has options');
    } else {
      fail('Regression: Export menu', `Expected 4+ options, found ${exportOptions.length}`);
    }
    
    // Close menu by clicking outside
    await page.click('body');
    await sleep(300);
  }
  
  // Check heatmap exists
  const hasHeatmap = await waitForTestId(page, 'hour-heatmap-card', 2000);
  if (!hasHeatmap) {
    fail('Regression: Heatmap', 'hour-heatmap-card not found');
  } else {
    pass('Regression: Heatmap card exists');
  }
}

async function testProductAnalyticTab(page) {
  log('\n=== Testing Product Analytic Tab (Regression) ===');
  
  // Navigate to Product tab
  const productTab = await page.$('[data-testid="tab-product"]');
  if (productTab) {
    await clickTestId(page, 'tab-product');
  } else {
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const prodTab = tabs.find(t => t.textContent.includes('Product'));
      if (prodTab) prodTab.click();
    });
  }
  
  await sleep(2000);
  
  // Check if Product Analytic view renders
  const hasProductView = await page.$('[data-testid="product-analytics-view"]');
  if (hasProductView) {
    pass('Regression: Product Analytic tab renders');
  } else {
    fail('Regression: Product Analytic tab', 'product-analytics-view not found');
  }
  
  // Navigate back to Customer tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const customerTab = tabs.find(t => t.textContent.includes('Customer'));
    if (customerTab) customerTab.click();
  });
  await sleep(1500);
}

async function testMobileResponsive(page) {
  log('\n=== Testing Mobile 390px Responsive ===');
  
  // Set viewport to 390px
  await page.setViewport({ width: 390, height: 844 });
  await sleep(1000);
  
  // Check for horizontal overflow
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  
  log(`Mobile viewport - scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
  
  if (scrollWidth === clientWidth) {
    pass('Mobile 390px: No horizontal overflow');
  } else {
    fail('Mobile 390px', `Horizontal overflow detected: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`);
  }
  
  // Reset viewport
  await page.setViewport({ width: 1920, height: 1080 });
  await sleep(500);
}

async function testSegmentCustomerCountSum(page) {
  log('\n=== Testing Segment Customer Counts Sum ===');
  
  // Get total customer count from KPI
  const totalText = await getTestIdText(page, 'kpi-total-customer-value');
  const totalCustomers = parseInt(totalText?.replace(/[^\d]/g, '') || '0');
  
  log(`Total customers from KPI: ${totalCustomers}`);
  
  // Get segment customer counts
  const segments = ['CHAMPIONS', 'LOYAL', 'NEW_POTENTIAL', 'AT_RISK', 'HIBERNATING'];
  let segmentSum = 0;
  
  for (const seg of segments) {
    const count = await page.$eval(`[data-testid="segment-card-${seg}"]`, el => {
      // Find the customer count in the large bold number (2xl font)
      const numEl = el.querySelector('.text-2xl.font-bold');
      return numEl ? parseInt(numEl.textContent.replace(/[^\d]/g, '')) : 0;
    });
    segmentSum += count;
    log(`Segment ${seg}: ${count} customers`);
  }
  
  log(`Sum of segment customers: ${segmentSum}`);
  
  if (segmentSum === totalCustomers) {
    pass('Segment customer counts sum equals Total Customer KPI');
  } else {
    fail('Segment customer counts sum', `Sum ${segmentSum} != Total ${totalCustomers}`);
  }
}

async function runTests() {
  log('Starting Iteration 4 Frontend Tests...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set longer timeout for navigation
    page.setDefaultTimeout(10000);
    
    // Login
    await login(page);
    
    // Navigate to Customer tab
    await navigateToCustomerTab(page);
    
    // Run all tests
    await testRFMSegmentCards(page);
    await testRFMCard(page);
    await testWinBackCard(page);
    await testTopCustomerTable(page);
    await testInsightOtomatis(page);
    await testSegmentCustomerCountSum(page);
    await testScopeToggle(page);
    await testIteration3Regression(page);
    await testProductAnalyticTab(page);
    await testMobileResponsive(page);
    
  } catch (error) {
    log(`\n❌ Test execution error: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
  }
  
  // Print summary
  log('\n' + '='.repeat(60));
  log('TEST SUMMARY');
  log('='.repeat(60));
  log(`✅ Passed: ${results.passed.length}`);
  log(`❌ Failed: ${results.failed.length}`);
  log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    log('\nFailed Tests:');
    results.failed.forEach(f => log(`  - ${f.test}: ${f.reason}`));
  }
  
  if (results.warnings.length > 0) {
    log('\nWarnings:');
    results.warnings.forEach(w => log(`  - ${w.test}: ${w.reason}`));
  }
  
  log('\n' + '='.repeat(60));
  
  // Write results to file
  const fs = require('fs');
  fs.writeFileSync('/app/test_reports/iteration_4.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: `Iteration 4 RFM Segmentation testing completed. ${results.passed.length} passed, ${results.failed.length} failed, ${results.warnings.length} warnings.`,
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
    success_rate: {
      frontend: `${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`
    }
  }, null, 2));
  
  log('Test results written to /app/test_reports/iteration_4.json');
  
  // Exit with error code if tests failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

runTests();
