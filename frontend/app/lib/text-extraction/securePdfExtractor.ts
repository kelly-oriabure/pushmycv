import { createHash } from 'crypto';
import { generateSecureHash } from '@/lib/security/piiEncryption';

/**
 * Secure PDF Text Extractor
 * 
 * Replaces the old pdfTextExtractor.ts with secure hashing using salts
 * to prevent rainbow table attacks on PII data.
 */

export interface SecureExtractionResult {
    fullText: string;
    contactInfo: {
        emails: string[];
        phones: string[];
    };
    contentHash: string;
    emailHash: string | null;
    phoneHash: string | null;
    compositeHash: string;
    error?: string;
}

/**
 * Extract email addresses from text using regex
 */
function extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex) || [];

    // Remove duplicates and normalize
    return [...new Set(matches.map(email => email.toLowerCase().trim()))];
}

/**
 * Extract phone numbers from text using regex
 */
function extractPhones(text: string): string[] {
    // Multiple phone number patterns
    const phonePatterns = [
        /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
        /\+?[1-9]\d{1,14}/g, // International format
        /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // Standard format
    ];

    const phones: string[] = [];

    for (const pattern of phonePatterns) {
        const matches = text.match(pattern) || [];
        phones.push(...matches);
    }

    // Clean and normalize phone numbers
    return [...new Set(phones.map(phone => {
        // Remove all non-digit characters except +
        const cleaned = phone.replace(/[^\d\+]/g, '');
        // Ensure it starts with + for international numbers
        if (cleaned.length === 10 && !cleaned.startsWith('+')) {
            return '+1' + cleaned; // Assume US number
        }
        return cleaned;
    }).filter(phone => phone.length >= 10))];
}

/**
 * Generate secure content hash with salt
 */
function generateSecureContentHash(text: string): string {
    return generateSecureHash(text, 'content');
}

/**
 * Generate secure email hash with salt
 */
function generateSecureEmailHash(emails: string[]): string | null {
    if (emails.length === 0) return null;

    const emailString = emails.sort().join('|');
    return generateSecureHash(emailString, 'email');
}

/**
 * Generate secure phone hash with salt
 */
function generateSecurePhoneHash(phones: string[]): string | null {
    if (phones.length === 0) return null;

    const phoneString = phones.sort().join('|');
    return generateSecureHash(phoneString, 'phone');
}

/**
 * Generate secure composite hash for duplicate detection
 */
function generateSecureCompositeHash(
    contentHash: string,
    emailHash: string | null,
    phoneHash: string | null
): string {
    const components = [
        contentHash,
        emailHash || 'no-email',
        phoneHash || 'no-phone'
    ];

    const combined = components.join('|');
    return generateSecureHash(combined, 'content');
}

/**
 * Extract text and contact information from PDF buffer using pdf-parse
 * with secure hashing
 */
export async function extractTextFromPdfSecure(buffer: Buffer): Promise<SecureExtractionResult> {
    try {
        // Dynamically import pdf-parse
        let pdf: any;
        try {
            const mod = await import('pdf-parse/lib/pdf-parse.js');
            pdf = (mod as any).default || mod;
        } catch {
            // Fallback if subpath isn't available
            const mod = await import('pdf-parse');
            pdf = (mod as any).default || mod;
        }

        // Parse PDF using pdf-parse
        const data = await pdf(buffer);
        const fullText = data.text.replace(/\s+/g, ' ').trim();

        // Extract contact information
        const emails = extractEmails(fullText);
        const phones = extractPhones(fullText);

        // Generate secure hashes with salts
        const contentHash = generateSecureContentHash(fullText);
        const emailHash = generateSecureEmailHash(emails);
        const phoneHash = generateSecurePhoneHash(phones);
        const compositeHash = generateSecureCompositeHash(contentHash, emailHash, phoneHash);

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
export function validateSecureContactInfo(contactInfo: { emails: string[]; phones: string[] }): {
    validEmails: string[];
    validPhones: string[];
    hasValidContact: boolean;
} {
    const validEmails = contactInfo.emails.filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    });

    const validPhones = contactInfo.phones.filter(phone => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) && phone.length >= 10;
    });

    return {
        validEmails,
        validPhones,
        hasValidContact: validEmails.length > 0 || validPhones.length > 0
    };
}

/**
 * Get primary contact information
 */
export function getPrimarySecureContact(contactInfo: { emails: string[]; phones: string[] }): {
    primaryEmail: string | null;
    primaryPhone: string | null;
} {
    return {
        primaryEmail: contactInfo.emails.length > 0 ? contactInfo.emails[0] : null,
        primaryPhone: contactInfo.phones.length > 0 ? contactInfo.phones[0] : null
    };
}

/**
 * Compare two extraction results for duplicate detection
 */
export function compareSecureExtractions(
    result1: SecureExtractionResult,
    result2: SecureExtractionResult
): {
    isDuplicate: boolean;
    similarity: number;
    matchingFields: string[];
} {
    const matchingFields: string[] = [];
    let similarity = 0;

    // Compare hashes
    if (result1.contentHash === result2.contentHash) {
        matchingFields.push('content');
        similarity += 40;
    }

    if (result1.emailHash && result2.emailHash && result1.emailHash === result2.emailHash) {
        matchingFields.push('email');
        similarity += 30;
    }

    if (result1.phoneHash && result2.phoneHash && result1.phoneHash === result2.phoneHash) {
        matchingFields.push('phone');
        similarity += 30;
    }

    // Consider it a duplicate if composite hash matches or high similarity
    const isDuplicate = result1.compositeHash === result2.compositeHash || similarity >= 70;

    return {
        isDuplicate,
        similarity,
        matchingFields
    };
}

/**
 * Legacy compatibility function
 * Maps secure extraction result to old format for backward compatibility
 */
export function mapToLegacyFormat(secureResult: SecureExtractionResult): any {
    return {
        fullText: secureResult.fullText,
        contactInfo: secureResult.contactInfo,
        contentHash: secureResult.contentHash,
        emailHash: secureResult.emailHash,
        phoneHash: secureResult.phoneHash,
        compositeHash: secureResult.compositeHash,
        error: secureResult.error
    };
}
