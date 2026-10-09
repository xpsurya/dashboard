const puppeteer = require('puppeteer');

async function debug() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Wait for page to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Customer tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const customerTab = tabs.find(t => t.textContent.includes('Customer'));
    if (customerTab) customerTab.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Get KPI value
  const kpiText = await page.$eval('[data-testid="kpi-total-customer-value"]', el => el.textContent);
  console.log('KPI Total Customer:', kpiText);
  
  // Get segment card details
  const segments = ['CHAMPIONS', 'LOYAL', 'NEW_POTENTIAL', 'AT_RISK', 'HIBERNATING'];
  
  for (const seg of segments) {
    const cardHtml = await page.$eval(`[data-testid="segment-card-${seg}"]`, el => el.innerHTML);
    const cardText = await page.$eval(`[data-testid="segment-card-${seg}"]`, el => el.textContent);
    console.log(`\n=== ${seg} ===`);
    console.log('Text:', cardText);
    console.log('HTML snippet:', cardHtml.substring(0, 500));
  }
  
  await browser.close();
}

debug();
