/**
 * Daily Proverbs - Automated Screenshot Generator
 * Requires: npm install puppeteer (from this directory)
 * Usage: ensure app is at http://localhost:8080, then:
 *   node create-screenshots.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = path.join(__dirname, 'screenshots');

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 812 },
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

async function takeScreenshot(page, name) {
  const filename = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: false });
  console.log(`✓ Saved: ${name}.png`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureLightTheme(page) {
  const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  if (isDark) {
    await page.click('#themeToggle');
    await delay(300);
  }
}

async function setLanguage(page, code) {
  // App uses #languageSelector + localStorage (no ?lang= query support)
  await page.select('#languageSelector', code);
  await delay(800);
}

async function goToDaily(page) {
  await page.click('[data-view="daily"]');
  await delay(400);
}

async function main() {
  console.log('📸 Starting screenshot generation...\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: VIEWPORTS.desktop,
  });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#languageSelector');

    // Desktop screenshots
    console.log('🖥️  Desktop screenshots...');
    await page.setViewport(VIEWPORTS.desktop);

    for (const lang of LANGUAGES) {
      await setLanguage(page, lang.code);
      await goToDaily(page);
      await ensureLightTheme(page);

      await takeScreenshot(page, `desktop-${lang.code}-light-today`);

      await page.click('#themeToggle');
      await delay(400);
      await takeScreenshot(page, `desktop-${lang.code}-dark-today`);

      await page.click('[data-view="browse"]');
      await delay(400);
      await takeScreenshot(page, `desktop-${lang.code}-dark-browse`);

      await ensureLightTheme(page);
    }

    // Mobile screenshots
    console.log('\n📱 Mobile screenshots...');
    await page.setViewport(VIEWPORTS.mobile);

    for (const lang of LANGUAGES) {
      await setLanguage(page, lang.code);
      await goToDaily(page);
      await ensureLightTheme(page);
      await takeScreenshot(page, `mobile-${lang.code}-light-today`);

      await page.click('#themeToggle');
      await delay(400);
      await takeScreenshot(page, `mobile-${lang.code}-dark-today`);
    }

    // Tablet screenshots
    console.log('\n📱 Tablet screenshots...');
    await page.setViewport(VIEWPORTS.tablet);
    await setLanguage(page, 'en');
    await goToDaily(page);
    await ensureLightTheme(page);
    await takeScreenshot(page, 'tablet-en-light-today');

    console.log('\n✅ All screenshots generated!');
    console.log(`📁 Location: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
