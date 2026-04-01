// Node.js compatible PDF text extraction using pdf-parse
import 'server-only';
import { createHash } from 'crypto';

export interface ExtractedContactInfo {
    emails: string[];
    phones: string[];
}

export interface PdfTextExtractionResult {
    fullText: string;
    contactInfo: ExtractedContactInfo;
    contentHash: string;
    emailHash: string | null;
    phoneHash: string | null;
    compositeHash: string;
    error?: string;
}

// Regex patterns for email and phone extraction
// Bounded email regex: capture core email only in group 1 to avoid adjacent glue (e.g., phone numbers, hyphens, trailing letters)
const EMAIL_BOUNDED_REGEX = /(?:^|[^A-Za-z0-9._%+-])([A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,24})(?![A-Za-z])/g;
const PHONE_REGEX = /(?:\+?1[-\s]?)?(?:\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4})|(?:\+?[1-9]\d{0,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9})/g;

/**
 * Extract email addresses from text using regex
 */
function extractEmails(text: string): string[] {
    const results: string[] = [];
    const iter = text.matchAll(EMAIL_BOUNDED_REGEX);
    for (const m of iter) {
        const email = (m[1] || '').toLowerCase().trim();
        if (email) results.push(email);
    }
    return [...new Set(results)];
}

/**
 * Extract phone numbers from text using regex
 */
function extractPhones(text: string): string[] {
    const matches = text.match(PHONE_REGEX);
    if (!matches) return [];

    // Clean and normalize phone numbers
    const cleanedPhones = matches.map(phone => {
        // Remove all non-digit characters except +
        return phone.replace(/[^\d+]/g, '')
            .replace(/^1/, '') // Remove leading 1 for US numbers
            .replace(/^\+1/, ''); // Remove +1 prefix
    });

    // Remove duplicates and filter out invalid numbers
    return [...new Set(cleanedPhones)]
        .filter(phone => phone.length >= 10 && phone.length <= 15);
}

/**
 * Generate SHA-256 hash from text content
 */
function generateContentHash(text: string): string {
    return createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Generate hash from email addresses
 */
function generateEmailHash(emails: string[]): string | null {
    if (emails.length === 0) return null;
    const emailString = emails.sort().join('|');
    return createHash('sha256').update(emailString).digest('hex');
}

/**
 * Generate hash from phone numbers
 */
function generatePhoneHash(phones: string[]): string | null {
    if (phones.length === 0) return null;
    const phoneString = phones.sort().join('|');
    return createHash('sha256').update(phoneString).digest('hex');
}

/**
 * Generate composite hash for duplicate detection
 */
function generateCompositeHash(contentHash: string, emailHash: string | null, phoneHash: string | null): string {
    const components = [contentHash, emailHash || 'no-email', phoneHash || 'no-phone'];
    return createHash('sha256').update(components.join('|')).digest('hex');
}

/**
 * Extract text and contact information from PDF buffer using pdf-parse
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfTextExtractionResult> {
    try {
        // Dynamically import. Prefer direct implementation path to avoid bundler touching test fixtures
        let pdf: any;
        try {
            const mod = await import('pdf-parse/lib/pdf-parse.js');
            pdf = (mod as any).default || mod;
        } catch {
            // Fallback if subpath isn't available in this install
            const mod = await import('pdf-parse');
            pdf = (mod as any).default || mod;
        }

        // Parse PDF using pdf-parse
        const data = await pdf(buffer);
        const fullText = data.text.replace(/\s+/g, ' ').trim();

        // Extract contact information
        const emails = extractEmails(fullText);
        const phones = extractPhones(fullText);

        // Generate hashes
        const contentHash = generateContentHash(fullText);
        const emailHash = generateEmailHash(emails);
        const phoneHash = generatePhoneHash(phones);
        const compositeHash = generateCompositeHash(contentHash, emailHash, phoneHash);

        return {
            fullText,
            contactInfo: {
                emails,
                phones
            },
            contentHash,
            emailHash,
            phoneHash,
            compositeHash
        };

    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return {
            fullText: '',
            contactInfo: {
                emails: [],
                phones: []
            },
            contentHash: '',
            emailHash: null,
            phoneHash: null,
            compositeHash: '',
            error: `Failed to extract text from PDF: ${error}`
        };
    }
}

/**
 * Validate extracted contact information
 */
export function validateContactInfo(contactInfo: ExtractedContactInfo): {
    validEmails: string[];
    validPhones: string[];
    hasValidContact: boolean;
} {
    const validEmails = contactInfo.emails.filter(email => {
        // Basic email validation
        return email.includes('@') && email.includes('.') && email.length > 5;
    });

    const validPhones = contactInfo.phones.filter(phone => {
        // Basic phone validation (10-15 digits)
        return phone.length >= 10 && phone.length <= 15 && /^\d+$/.test(phone);
    });

    return {
        validEmails,
        validPhones,
        hasValidContact: validEmails.length > 0 || validPhones.length > 0
    };
}

/**
 * Extract primary contact information (first email and phone found)
 */
export function getPrimaryContact(contactInfo: ExtractedContactInfo): {
    primaryEmail: string | null;
    primaryPhone: string | null;
} {
    const validated = validateContactInfo(contactInfo);

    return {
        primaryEmail: validated.validEmails[0] || null,
        primaryPhone: validated.validPhones[0] || null
    };
}