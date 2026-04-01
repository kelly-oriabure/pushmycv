import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Simple test HTML content
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test PDF</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .container {
              width: 21cm;
              min-height: 29.7cm;
              margin: 0 auto;
              padding: 20px;
              background-color: white;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Test PDF Generation</h1>
            <p>This is a simple test to verify PDF generation is working correctly.</p>
            <p>If you can see this content in the PDF, then the PDF generation is working.</p>
          </div>
        </body>
      </html>
    `;

    // Send to the main PDF generation route
    const response = await fetch('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: testHtml,
        options: {
          format: 'a4',
          printBackground: true,
        },
        filename: 'test.pdf'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'PDF generation failed', details: errorData },
        { status: response.status }
      );
    }

    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    });
  } catch (error) {
    console.error('Error in test PDF route:', error);
    return NextResponse.json(
      { error: 'Failed to generate test PDF', details: (error as Error).message },
      { status: 500 }
    );
  }
}
