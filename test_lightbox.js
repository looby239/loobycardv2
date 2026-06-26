const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setViewport({ width: 400, height: 800, deviceScaleFactor: 2 });

    console.log('Navigating to http://localhost:3000/template11...');
    await page.goto('http://localhost:3000/template11', { waitUntil: 'networkidle0' });
    
    // Hide envelope overlay
    await page.evaluate(() => {
      const envelope = document.getElementById('envelope-overlay');
      if (envelope) envelope.style.display = 'none';
      const mainContainer = document.getElementById('main-container');
      if (mainContainer) mainContainer.style.display = 'block';
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find a gallery image and click it
    await page.evaluate(() => {
      const galleryImg = document.querySelector('.gallery-img');
      if (galleryImg) {
        galleryImg.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if lightbox is visible
    const isLightboxVisible = await page.evaluate(() => {
      const lightbox = document.getElementById('lightbox');
      if (!lightbox) return false;
      const rect = lightbox.getBoundingClientRect();
      const style = window.getComputedStyle(lightbox);
      return style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });

    console.log('Is lightbox visible?', isLightboxVisible);
    await browser.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
