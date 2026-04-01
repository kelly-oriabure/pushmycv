/**
 * Tests for processPdfUpload orchestrator.
 * Note: Requires Jest to resolve path aliases (see jest.config.js moduleNameMapper).
 */
import { processPdfUpload } from '../../app/lib/services/resumeUploadService';

jest.mock('../../app/lib/text-extraction/pdf', () => ({
  extractTextFromPdf: jest.fn(async (buf: Buffer) => ({
    text: 'John Doe\nEmail: john@example.com',
    contentHash: 'hash-content',
    emailHash: 'hash-email',
    phoneHash: null,
    compositeHash: 'hash-content|hash-email',
    contact: {
      emails: ['john@example.com'],
      phones: [],
      primaryEmail: 'john@example.com',
      primaryPhone: null,
    },
  })),
  getPrimaryContact: jest.fn((contact: any) => ({
    primaryEmail: contact.emails?.[0] ?? null,
    primaryPhone: contact.phones?.[0] ?? null,
  })),
}));

// Mock duplicate detection adapter
jest.mock('../../app/lib/duplicates/detection', () => ({
  detectDuplicateResume: jest.fn(async (_supabase: any, hashes: any, _userId: string) => {
    if (hashes.emailHash === 'dup-email') {
      return { action: 'duplicate', isDuplicate: true, reason: 'same email' };
    }
    if (hashes.contentHash === 'needs-update') {
      return {
        action: 'update',
        shouldUpdate: true,
        existingRecord: { id: 'existing-id-1', resume_url: 'img.png', pdf_url: 'doc.pdf' },
        reason: 'content changed',
      };
    }
    return { action: 'create', reason: 'no match' };
  }),
}));

describe('processPdfUpload', () => {
  const supabaseStub: any = {}; // not used directly in orchestrator logic at the moment

  test('returns create when no match', async () => {
    const res = await processPdfUpload({
      supabase: supabaseStub,
      userId: 'user1',
      pdf: { bytes: new Uint8Array([1, 2, 3]).buffer, name: 'a.pdf', size: 3, type: 'application/pdf' },
    });

    expect(res.action).toBe('create');
    expect(res.extractedData?.fullText).toContain('John Doe');
    expect(res.extractedData?.primaryEmail).toBe('john@example.com');
  });

  test('returns duplicate when email hash matches', async () => {
    // Override extractor mock to yield a specific emailHash
    const { extractTextFromPdf } = jest.requireMock('../../app/lib/text-extraction/pdf');
    (extractTextFromPdf as jest.Mock).mockResolvedValueOnce({
      text: 'Duplicate',
      contentHash: 'x',
      emailHash: 'dup-email',
      phoneHash: null,
      compositeHash: 'x|dup-email',
      contact: { emails: ['dup@example.com'], phones: [], primaryEmail: 'dup@example.com', primaryPhone: null },
    });

    const res = await processPdfUpload({
      supabase: supabaseStub,
      userId: 'user1',
      pdf: { bytes: new Uint8Array([4, 5]).buffer, name: 'b.pdf', size: 2, type: 'application/pdf' },
    });

    expect(res.action).toBe('duplicate');
    expect(res.message.toLowerCase()).toContain('duplicate');
  });

  test('returns update when content indicates change', async () => {
    const { extractTextFromPdf } = jest.requireMock('../../app/lib/text-extraction/pdf');
    (extractTextFromPdf as jest.Mock).mockResolvedValueOnce({
      text: 'Needs update',
      contentHash: 'needs-update',
      emailHash: 'ok',
      phoneHash: null,
      compositeHash: 'needs-update|ok',
      contact: { emails: ['ok@example.com'], phones: [], primaryEmail: 'ok@example.com', primaryPhone: null },
    });

    const res = await processPdfUpload({
      supabase: supabaseStub,
      userId: 'user1',
      pdf: { bytes: new Uint8Array([7]).buffer, name: 'c.pdf', size: 1, type: 'application/pdf' },
    });

    expect(res.action).toBe('update');
    expect(res.extractedData?.contentHash).toBe('needs-update');
  });
});
