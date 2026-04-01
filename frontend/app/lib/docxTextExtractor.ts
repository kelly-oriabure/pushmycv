import 'server-only';
import { createHash } from 'crypto';

import type { PdfTextExtractionResult } from '@/lib/pdfTextExtractor';

const EMAIL_BOUNDED_REGEX = /(?:^|[^A-Za-z0-9._%+-])([A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,24})(?![A-Za-z])/g;
const PHONE_REGEX = /(?:\+?1[-\s]?)?(?:\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4})|(?:\+?[1-9]\d{0,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9})/g;

function extractEmails(text: string): string[] {
  const results: string[] = [];
  const iter = text.matchAll(EMAIL_BOUNDED_REGEX);
  for (const m of iter) {
    const email = (m[1] || '').toLowerCase().trim();
    if (email) results.push(email);
  }
  return [...new Set(results)];
}

function extractPhones(text: string): string[] {
  const matches = text.match(PHONE_REGEX);
  if (!matches) return [];
  const cleaned = matches.map(phone =>
    phone
      .replace(/[^\d+]/g, '')
      .replace(/^1/, '')
      .replace(/^\+1/, '')
  );
  return [...new Set(cleaned)].filter(phone => phone.length >= 10 && phone.length <= 15);
}

function generateContentHash(text: string): string {
  return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

function generateEmailHash(emails: string[]): string | null {
  if (emails.length === 0) return null;
  const emailString = emails.sort().join('|');
  return createHash('sha256').update(emailString).digest('hex');
}

function generatePhoneHash(phones: string[]): string | null {
  if (phones.length === 0) return null;
  const phoneString = phones.sort().join('|');
  return createHash('sha256').update(phoneString).digest('hex');
}

function generateCompositeHash(contentHash: string, emailHash: string | null, phoneHash: string | null): string {
  const components = [contentHash, emailHash || 'no-email', phoneHash || 'no-phone'];
  return createHash('sha256').update(components.join('|')).digest('hex');
}

export async function extractTextFromDocx(buffer: Buffer): Promise<PdfTextExtractionResult> {
  try {
    const mod = await import('mammoth');
    const mammoth = (mod as any).default || mod;
    const result = await mammoth.extractRawText({ buffer });
    const fullText = String(result?.value || '').replace(/\s+/g, ' ').trim();

    const emails = extractEmails(fullText);
    const phones = extractPhones(fullText);

    const contentHash = generateContentHash(fullText);
    const emailHash = generateEmailHash(emails);
    const phoneHash = generatePhoneHash(phones);
    const compositeHash = generateCompositeHash(contentHash, emailHash, phoneHash);

    return {
      fullText,
      contactInfo: { emails, phones },
      contentHash,
      emailHash,
      phoneHash,
      compositeHash,
    };
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return {
      fullText: '',
      contactInfo: { emails: [], phones: [] },
      contentHash: '',
      emailHash: null,
      phoneHash: null,
      compositeHash: '',
      error: `Failed to extract text from DOCX: ${error}`,
    };
  }
}

