const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const baseUrl = 'http://localhost:3000';
  
  console.log(`Opening ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. Dashboard (default tab)
  console.log('Capturing Dashboard...');
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'dashboard.png'), 
    fullPage: false 
  });
  console.log('✓ Dashboard captured');
  
  // 2. Workout Tab - use XPath
  console.log('Capturing Workout...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Workout')) {
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'workout.png'), 
    fullPage: false 
  });
  console.log('✓ Workout captured');
  
  // 3. Exercise Detail
  console.log('Capturing Exercise Detail...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Bench Press')) {
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'exercise-detail.png'), 
    fullPage: false 
  });
  console.log('✓ Exercise Detail captured');
  
  // 4. Back to Dashboard then Coach
  console.log('Capturing AI Coach...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Dashboard')) {
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Advisor')) {
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'coach.png'), 
    fullPage: false 
  });
  console.log('✓ AI Coach captured');
  
  // 5. Settings
  console.log('Capturing Settings...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Settings')) {
        btn.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ 
    path: path.join(SCREENSHOTS_DIR, 'settings.png'), 
    fullPage: false 
  });
  console.log('✓ Settings captured');
  
  await browser.close();
  console.log('\n✅ All screenshots captured from localhost!');
  console.log(`Location: ${SCREENSHOTS_DIR}`);
}

captureScreenshots().catch(console.error);
