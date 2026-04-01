const puppeteer = require('puppeteer');

async function testPuppeteer() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('Page created successfully');
    
    // Test with simple HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test PDF</title>
        </head>
        <body>
          <h1>Test PDF Generation</h1>
          <p>This is a simple test to verify Puppeteer is working correctly.</p>
        </body>
      </html>
    `;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    console.log('Content set successfully');
    
    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true
    });
    
    console.log('PDF generated successfully, size:', pdf.byteLength, 'bytes');
    
    await browser.close();
    console.log('Test completed successfully!');
    
    return true;
  } catch (error) {
    console.error('Puppeteer test failed:', error);
    
    if (browser) {
      await browser.close();
    }
    
    return false;
  }
}

testPuppeteer()
  .then(success => {
    if (success) {
      console.log('Puppeteer is working correctly');
      process.exit(0);
    } else {
      console.log('Puppeteer test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });