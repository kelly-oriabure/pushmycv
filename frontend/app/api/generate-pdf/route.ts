import { NextRequest, NextResponse } from 'next/server';
import type { PDFOptions } from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';
import { withRateLimit, rateLimitKey } from '@/app/lib/rateLimit';

export const maxDuration = 60; // Set max duration to 60 seconds for PDF generation
export const dynamic = 'force-dynamic'; // Make sure the route is not statically optimized
export const runtime = 'nodejs';

async function handlePOST(req: NextRequest) {
  let browser: any;
  try {
    const { html, options, filename = 'document.pdf' } = await req.json();
    
    // Initialize browser with robust error handling
    try {
      const isVercel = Boolean(process.env.VERCEL);
      let puppeteerModule: any;
      if (isVercel) {
        puppeteerModule = await import('puppeteer-core');
      } else {
        puppeteerModule = await import('puppeteer');
      }

      let executablePath: string | undefined;
      let launchArgs: string[] = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=medium',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ];

      if (isVercel) {
        const chromiumModule = await import('@sparticuz/chromium');
        const chromium = (chromiumModule as any).default ?? chromiumModule;
        executablePath = await chromium.executablePath();
        launchArgs = [...chromium.args, ...launchArgs];
      }

      browser = await puppeteerModule.launch({
        headless: true,
        args: launchArgs,
        ...(executablePath ? { executablePath } : {})
      });
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError);
      return NextResponse.json(
        { error: 'Failed to launch browser', details: browserError instanceof Error ? browserError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Create and set up page with robust error handling
    let page: any;
    try {
      page = await browser.newPage();
      
      // Set viewport to A4 size (in pixels, roughly A4 at 96 DPI)
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 3, // Higher scale factor for sharper rendering
      });
      
      // Increase timeout for content loading
      page.setDefaultNavigationTimeout(60000);

      // Log failed requests to debug asset loading issues
      page.on('requestfailed', (request: any) => {
        console.error(`Request failed: ${request.url()}`, request.failure());
      });
    } catch (pageError) {
      if (browser) {
        await browser.close();
      }
      console.error('Failed to set up page:', pageError);
      return NextResponse.json(
        { error: 'Failed to set up page', details: pageError instanceof Error ? pageError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Set content with robust error handling
    try {
      // Ensure proper encoding for the HTML content
      const encodedHtml = Buffer.from(html, 'utf-8').toString('utf-8');
      
      // Set content with proper encoding and wait for rendering
      await page.setContent(encodedHtml, { 
        waitUntil: 'networkidle0',
        timeout: 60000 // 60 seconds timeout
      });

      // Add a longer delay to ensure all assets are loaded
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if the content loaded properly with more comprehensive validation
      const contentValidation = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        
        // Check if body has content
        const hasBodyContent = body.innerHTML.trim().length > 0;
        const textContent = body.textContent;
        const hasTextContent = textContent ? textContent.trim().length > 0 : false;
        
        // Check if there are actual elements (not just empty tags)
        const elements = body.querySelectorAll('*');
        const hasElements = elements.length > 0;
        
        // Check for common resume content indicators
        const hasHeaders = body.querySelectorAll('h1, h2, h3').length > 0;
        const hasTextElements = body.querySelectorAll('p, span, div').length > 0;
        
        return {
          hasBodyContent,
          hasTextContent,
          hasElements,
          hasHeaders,
          hasTextElements,
          elementCount: elements.length
        };
      });
      
      // More comprehensive validation
      if (!contentValidation.hasBodyContent || contentValidation.elementCount === 0) {
        throw new Error(`Content failed to load properly. Elements found: ${contentValidation.elementCount}`);
      }
      
      console.log('Content validation results:', contentValidation);
    } catch (contentError) {
      if (browser) {
        await browser.close();
      }
      console.error('Failed to set HTML content:', contentError);
      return NextResponse.json(
        { error: 'Failed to set HTML content', details: contentError instanceof Error ? contentError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Emulate print media type to apply print-specific styles
    await page.emulateMediaType('print');
    
    // Configure PDF options with improved settings for better quality
    const normalizedFormat = typeof options?.format === 'string' ? options.format.toLowerCase() : options?.format;

    const marginValue = options?.margin ?? '0mm';
    const margin =
      typeof marginValue === 'number'
        ? `${marginValue}mm`
        : typeof marginValue === 'string'
          ? marginValue
          : '0mm';

    const basePdfOptions: PDFOptions = {
      printBackground: true,
      margin: {
        top: margin,
        right: margin,
        bottom: margin,
        left: margin,
      },
      scale: typeof options?.scale === 'number' ? options.scale : 1.0,
      landscape: false,
    };

    const pdfOptions: PDFOptions =
      !normalizedFormat || normalizedFormat === 'a4'
        ? { ...basePdfOptions, width: '210mm', height: '297mm', preferCSSPageSize: false }
        : { ...basePdfOptions, format: options.format || 'a4', preferCSSPageSize: true };

    // Generate PDF with robust error handling
    let pdf: Uint8Array | Buffer;
    try {
      pdf = await page.pdf(pdfOptions);
    } catch (pdfError) {
      if (browser) {
        await browser.close();
      }
      console.error('Failed to generate PDF:', pdfError);
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: pdfError instanceof Error ? pdfError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    if (!normalizedFormat || normalizedFormat === 'a4') {
      try {
        const bytes = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
        const parsed = await PDFDocument.load(bytes);
        const firstPage = parsed.getPages()[0];
        if (firstPage) {
          const { width, height } = firstPage.getSize();
          if (width > height) {
            const retryOptions: PDFOptions = { ...basePdfOptions, format: 'A4', preferCSSPageSize: false };
            pdf = await page.pdf(retryOptions);
          }
        }
      } catch { }
    }

    // Close browser
    try {
      if (browser) {
        await browser.close();
      }
    } catch (closeError) {
      console.error('Warning: Failed to close browser cleanly:', closeError);
      // Continue with response even if browser doesn't close cleanly
    }
    
    // Handle base64 return if requested
    if (options && options.returnBase64) {
      // Ensure pdf is treated as Buffer
      const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
      return NextResponse.json({
        base64: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
      });
    }
    
    // Return PDF as download
    const pdfBody = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    const pdfBytes = Uint8Array.from(pdfBody);
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    // Ensure browser is closed even if there's an unexpected error
    try {
      if (browser) {
        await browser.close();
      }
    } catch (closeError) {
      console.error('Warning: Failed to close browser in error handler:', closeError);
    }
    
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 10 PDF generations per minute per user/IP
export const POST = withRateLimit(handlePOST, {
  getKey: (req) => rateLimitKey(req, 'generate-pdf', 'rl-pdf'),
  options: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 PDF generations per minute
    keyPrefix: 'generate-pdf',
  },
});
