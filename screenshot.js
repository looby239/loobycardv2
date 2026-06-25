const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 400,
      height: 500,
      deviceScaleFactor: 2,
    });

    console.log('Navigating to https://loobycard.com/template11...');
    await page.goto('https://loobycard.com/template11', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For template11, since the envelope overlays the card, 
    // we need to hide the envelope to take a screenshot of the inside, 
    // or maybe the user WANTS the envelope as the thumbnail?
    // Wait, the user attached an image! Let me see what the image looks like...
    // The image shows a beautiful couple photo with an arch frame, text "Phương Thảo & Minh Quân", and date "16.06.2027".
    // This is EXACTLY the inside of the card (the hero section)!
    // To take a screenshot of the inside, I must hide the envelope overlay!
    await page.evaluate(() => {
      const envelope = document.getElementById('envelope-overlay');
      if (envelope) envelope.style.display = 'none';
      const mainContainer = document.getElementById('main-container');
      if (mainContainer) mainContainer.style.display = 'block';
    });
    
    // Wait for a second after hiding the envelope to allow layout to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'public/assets/images/template-11-thumbnail.png' });
    
    console.log('Screenshot saved to public/assets/images/template-11-thumbnail.png');
    await browser.close();
  } catch (err) {
    console.error('Error taking screenshot:', err);
    process.exit(1);
  }
})();
