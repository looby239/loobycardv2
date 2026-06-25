const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to a 4:5 aspect ratio
    await page.setViewport({
      width: 400,
      height: 500,
      deviceScaleFactor: 2, // for better quality
    });

    console.log('Navigating to https://loobycard.com/loc-thu...');
    await page.goto('https://loobycard.com/loc-thu', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for a second to ensure animations and fonts are loaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'public/assets/images/template-10-thumbnail.png' });
    
    console.log('Screenshot saved to public/assets/images/template-10-thumbnail.png');
    await browser.close();
  } catch (err) {
    console.error('Error taking screenshot:', err);
    process.exit(1);
  }
})();
