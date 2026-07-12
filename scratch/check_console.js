import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE - ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[BROWSER RUNTIME ERROR]:', err.toString());
  });

  try {
    console.log('Navigating to http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded. Waiting 3 seconds for console logs...');
    await new Promise(resolve => setTimeout(resolve, 3500));
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
  }
})();
