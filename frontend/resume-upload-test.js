const { chromium } = require('playwright');

async function testResumeUpload() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to the homepage
        await page.goto('http://localhost:3000');

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click on the resume analysis link or button
        // You'll need to adjust this selector based on your actual UI
        await page.click('text=Resume Analysis');

        // Wait for the upload page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Upload a test resume
        // You'll need to adjust this path to point to an actual resume file
        const resumePath = 'path/to/your/test/resume.pdf';
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            await fileInput.setInputFiles(resumePath);
        }

        // Wait for upload to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if the upload was successful
        const successMessage = await page.$('text=Upload successful');
        if (successMessage) {
            console.log('Resume upload test passed!');
        } else {
            console.log('Resume upload test failed or still processing...');
        }

        // Keep the browser open for manual inspection
        console.log('Test completed. Browser will remain open for inspection.');
        console.log('Press Ctrl+C to close the browser.');

        // Wait indefinitely for manual inspection
        await new Promise(() => { });
    } catch (error) {
        console.error('Test failed:', error);
        await browser.close();
    }
}

testResumeUpload();