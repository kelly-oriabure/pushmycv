import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdf } from '@/app/lib/pdfTextExtractor';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🧪 PDF Text Extraction Test API called');

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('📄 File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        success: false
      }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        error: 'File must be a PDF',
        success: false,
        receivedType: file.type
      }, { status: 400 });
    }

    console.log('🔍 Starting PDF text extraction...');

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractionResult = await extractTextFromPdf(buffer);

    console.log('📊 Extraction completed:', {
      hasText: extractionResult.fullText.length > 0,
      textLength: extractionResult.fullText.length,
      emailCount: extractionResult.contactInfo.emails.length,
      phoneCount: extractionResult.contactInfo.phones.length,
      hasContentHash: !!extractionResult.contentHash,
      hasEmailHash: !!extractionResult.emailHash,
      hasPhoneHash: !!extractionResult.phoneHash,
      hasCompositeHash: !!extractionResult.compositeHash
    });

    return NextResponse.json({
      success: true,
      extractedText: extractionResult.fullText,
      textLength: extractionResult.fullText.length,
      emails: extractionResult.contactInfo.emails,
      phones: extractionResult.contactInfo.phones,
      hashes: {
        content: extractionResult.contentHash,
        email: extractionResult.emailHash,
        phone: extractionResult.phoneHash,
        composite: extractionResult.compositeHash
      },
      error: extractionResult.error
    });

  } catch (error) {
    console.error('❌ PDF extraction test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'PDF extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}