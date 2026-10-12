// scripts/test-iphone.js
const { webkit, devices } = require('playwright');

(async () => {
  const iPhone = devices['iPhone 14 Pro'];
  console.log('Emulating:', iPhone.userAgent);

  const browser = await webkit.launch({
    headless: false, // show the window
  });

  const context = await browser.newContext({
    ...iPhone,
    // Force mobile behavior
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Log console messages from the page
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Log errors
  page.on('pageerror', (err) => {
    console.log('[PAGE ERROR]', err.message);
  });

  await page.goto('http://localhost:8081', {
    waitUntil: 'networkidle',
  });

  console.log('\n✅ iPhone emulator running.');
  console.log('   Navigate through the onboarding manually.');
  console.log('   Console output appears above.');
  console.log('   Press Ctrl+C to stop.\n');

  // Keep the browser open
  await new Promise(() => {});
})();