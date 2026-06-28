const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  console.log("Navigating to ChatbotUI...");
  try {
    await page.goto('http://localhost:5173/chatbot?from=website', { waitUntil: 'networkidle2' });
    console.log("Page loaded. Title:", await page.title());
  } catch (e) {
    console.error("Navigation error:", e);
  }
  
  await browser.close();
})();
