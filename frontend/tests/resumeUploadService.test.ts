jest.mock('../app/lib/docxTextExtractor', () => ({
  extractTextFromDocx: async () => ({
    fullText: 'John Doe john@example.com +15551234567 Experience Acme',
    contactInfo: { emails: ['john@example.com'], phones: ['5551234567'] },
    contentHash: 'content',
    emailHash: 'email',
    phoneHash: 'phone',
    compositeHash: 'composite',
  }),
}));

jest.mock('../app/lib/duplicates/detection', () => ({
  detectDuplicateResume: async () => ({
    action: 'create',
    isDuplicate: false,
    isPartialMatch: false,
    shouldUpdate: false,
    message: 'New resume',
  }),
}));

import { processPdfUpload } from '@/app/lib/services/resumeUploadService';

describe('processPdfUpload', () => {
  test('accepts DOCX and returns extracted data', async () => {
    const result = await processPdfUpload({
      supabase: {} as any,
      userId: 'user-1',
      pdf: {
        bytes: Buffer.from('not-a-real-docx'),
        name: 'resume.docx',
        size: 123,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    } as any);

    expect(result.action).toBe('create');
    expect(result.extractedData?.fullText).toContain('John Doe');
    expect(result.extractedData?.primaryEmail).toBe('john@example.com');
  });

  test('returns unsupported message for unknown file types', async () => {
    const result = await processPdfUpload({
      supabase: {} as any,
      userId: 'user-1',
      pdf: {
        bytes: Buffer.from('abc'),
        name: 'resume.txt',
        size: 3,
        type: 'text/plain',
      },
    } as any);

    expect(result.action).toBe('create');
    expect(result.extractedData?.fullText || '').toBe('');
  });
});

