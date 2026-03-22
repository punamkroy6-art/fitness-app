const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'public', 'screenshots');

// Create screenshots directory
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
  
  const baseUrl = 'https://fitness-abzgrtsis-punam-roys-projects.vercel.app';
  
  const screenshots = [
    { name: 'dashboard.png', description: 'Dashboard with metrics' },
    { name: 'workout.png', description: 'Workout session' },
    { name: 'exercises.png', description: 'Exercise library' },
    { name: 'coach.png', description: 'AI Coach' },
    { name: 'settings.png', description: 'Settings and themes' },
  ];
  
  for (const shot of screenshots) {
    console.log(`Capturing ${shot.name}...`);
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, shot.name), 
      fullPage: false 
    });
    console.log(`✓ Saved ${shot.name}`);
  }
  
  await browser.close();
  console.log('\nAll screenshots captured!');
  console.log(`Location: ${SCREENSHOTS_DIR}`);
}

captureScreenshots().catch(console.error);
