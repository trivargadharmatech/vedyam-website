const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    await page.goto('http://localhost:5173/chatbot?from=website&query=Tell%20me%20about%20Karma&history=%5B%7B%22role%22%3A%22user%22%2C%22text%22%3A%22Tell%20me%20about%20Karma%22%7D%5D', { waitUntil: 'networkidle0' });
    
    await browser.close();
  } catch (err) {
    console.error('Puppeteer Error:', err);
  }
})();
