import crypto from 'crypto';

/**
 * PII Encryption and Security System
 * 
 * This module provides secure handling of Personally Identifiable Information (PII)
 * including encryption, secure hashing with salts, and GDPR/CCPA compliance features.
 */

export interface PIIField {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    cityState?: string;
    country?: string;
}

export interface EncryptedPII {
    email_encrypted?: string;
    phone_encrypted?: string;
    firstName_encrypted?: string;
    lastName_encrypted?: string;
    address_encrypted?: string;
    cityState_encrypted?: string;
    country_encrypted?: string;
    email_hash?: string;
    phone_hash?: string;
    name_hash?: string;
    address_hash?: string;
}

export interface PIIHashes {
    email_hash: string;
    phone_hash: string;
    name_hash: string;
    address_hash: string;
    composite_hash: string;
}

/**
 * Get encryption key from environment variables
 */
function getEncryptionKey(): string {
    const key = process.env.PII_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('PII_ENCRYPTION_KEY environment variable is required');
    }

    // Ensure key is 32 bytes for AES-256
    if (key.length !== 64) { // 64 hex chars = 32 bytes
        throw new Error('PII_ENCRYPTION_KEY must be 64 characters (32 bytes)');
    }

    return key;
}

/**
 * Get salt from environment variables or generate a default
 */
function getSalt(): string {
    const salt = process.env.PII_HASH_SALT;
    if (!salt) {
        throw new Error('PII_HASH_SALT environment variable is required');
    }

    if (salt.length < 32) {
        throw new Error('PII_HASH_SALT must be at least 32 characters');
    }

    return salt;
}

/**
 * Encrypt PII data using AES-256-GCM
 */
export function encryptPII(data: string): string {
    if (!data || data.trim() === '') {
        return '';
    }

    try {
        const key = Buffer.from(getEncryptionKey(), 'hex');
        const iv = crypto.randomBytes(16); // 128-bit IV
        const cipher = crypto.createCipher('aes-256-gcm', key);

        cipher.setAAD(Buffer.from('pii-encryption', 'utf8'));

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Combine IV + authTag + encrypted data
        const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;

        return combined;
    } catch (error) {
        console.error('PII encryption error:', error);
        throw new Error('Failed to encrypt PII data');
    }
}

/**
 * Decrypt PII data using AES-256-GCM
 */
export function decryptPII(encryptedData: string): string {
    if (!encryptedData || encryptedData.trim() === '') {
        return '';
    }

    try {
        const key = Buffer.from(getEncryptionKey(), 'hex');

        // Extract IV (32 hex chars = 16 bytes)
        const iv = Buffer.from(encryptedData.substring(0, 32), 'hex');

        // Extract auth tag (32 hex chars = 16 bytes)
        const authTag = Buffer.from(encryptedData.substring(32, 64), 'hex');

        // Extract encrypted data
        const encrypted = encryptedData.substring(64);

        const decipher = crypto.createDecipher('aes-256-gcm', key);
        decipher.setAAD(Buffer.from('pii-encryption', 'utf8'));
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('PII decryption error:', error);
        throw new Error('Failed to decrypt PII data');
    }
}

/**
 * Generate secure hash with salt for PII data
 */
export function hashPII(data: string, fieldType: string): string {
    if (!data || data.trim() === '') {
        return '';
    }

    try {
        const salt = getSalt();
        const normalizedData = data.toLowerCase().trim();

        // Create field-specific salt
        const fieldSalt = crypto
            .createHash('sha256')
            .update(salt + fieldType)
            .digest('hex');

        // Generate hash with field-specific salt
        const hash = crypto
            .createHash('sha256')
            .update(normalizedData + fieldSalt)
            .digest('hex');

        return hash;
    } catch (error) {
        console.error('PII hashing error:', error);
        throw new Error('Failed to hash PII data');
    }
}

/**
 * Encrypt and hash PII fields
 */
export function processPII(piiData: PIIField): { encrypted: EncryptedPII; hashes: PIIHashes } {
    const encrypted: EncryptedPII = {};
    const hashes: PIIHashes = {
        email_hash: '',
        phone_hash: '',
        name_hash: '',
        address_hash: '',
        composite_hash: ''
    };

    // Encrypt and hash email
    if (piiData.email) {
        encrypted.email_encrypted = encryptPII(piiData.email);
        hashes.email_hash = hashPII(piiData.email, 'email');
    }

    // Encrypt and hash phone
    if (piiData.phone) {
        encrypted.phone_encrypted = encryptPII(piiData.phone);
        hashes.phone_hash = hashPII(piiData.phone, 'phone');
    }

    // Encrypt and hash names
    if (piiData.firstName || piiData.lastName) {
        const fullName = `${piiData.firstName || ''} ${piiData.lastName || ''}`.trim();
        if (fullName) {
            encrypted.firstName_encrypted = piiData.firstName ? encryptPII(piiData.firstName) : '';
            encrypted.lastName_encrypted = piiData.lastName ? encryptPII(piiData.lastName) : '';
            hashes.name_hash = hashPII(fullName, 'name');
        }
    }

    // Encrypt and hash address
    if (piiData.address || piiData.cityState || piiData.country) {
        const fullAddress = [
            piiData.address,
            piiData.cityState,
            piiData.country
        ].filter(Boolean).join(', ');

        if (fullAddress) {
            encrypted.address_encrypted = piiData.address ? encryptPII(piiData.address) : '';
            encrypted.cityState_encrypted = piiData.cityState ? encryptPII(piiData.cityState) : '';
            encrypted.country_encrypted = piiData.country ? encryptPII(piiData.country) : '';
            hashes.address_hash = hashPII(fullAddress, 'address');
        }
    }

    // Generate composite hash for duplicate detection
    const hashComponents = [
        hashes.email_hash,
        hashes.phone_hash,
        hashes.name_hash,
        hashes.address_hash
    ].filter(Boolean);

    if (hashComponents.length > 0) {
        hashes.composite_hash = crypto
            .createHash('sha256')
            .update(hashComponents.join('|'))
            .digest('hex');
    }

    return { encrypted, hashes };
}

/**
 * Decrypt PII fields
 */
export function decryptPIIFields(encryptedData: EncryptedPII): PIIField {
    const decrypted: PIIField = {};

    if (encryptedData.email_encrypted) {
        decrypted.email = decryptPII(encryptedData.email_encrypted);
    }

    if (encryptedData.phone_encrypted) {
        decrypted.phone = decryptPII(encryptedData.phone_encrypted);
    }

    if (encryptedData.firstName_encrypted) {
        decrypted.firstName = decryptPII(encryptedData.firstName_encrypted);
    }

    if (encryptedData.lastName_encrypted) {
        decrypted.lastName = decryptPII(encryptedData.lastName_encrypted);
    }

    if (encryptedData.address_encrypted) {
        decrypted.address = decryptPII(encryptedData.address_encrypted);
    }

    if (encryptedData.cityState_encrypted) {
        decrypted.cityState = decryptPII(encryptedData.cityState_encrypted);
    }

    if (encryptedData.country_encrypted) {
        decrypted.country = decryptPII(encryptedData.country_encrypted);
    }

    return decrypted;
}

/**
 * Generate secure hash for duplicate detection (replaces old unsalted hashes)
 */
export function generateSecureHash(data: string, type: 'email' | 'phone' | 'content'): string {
    if (!data || data.trim() === '') {
        return '';
    }

    const salt = getSalt();
    const normalizedData = data.toLowerCase().trim();

    // Create type-specific salt
    const typeSalt = crypto
        .createHash('sha256')
        .update(salt + type)
        .digest('hex');

    // Generate hash with type-specific salt
    return crypto
        .createHash('sha256')
        .update(normalizedData + typeSalt)
        .digest('hex');
}

/**
 * Validate PII data before processing
 */
export function validatePII(piiData: PIIField): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Email validation
    if (piiData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(piiData.email)) {
            errors.push('Invalid email format');
        }
    }

    // Phone validation (basic)
    if (piiData.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(piiData.phone.replace(/[\s\-\(\)]/g, ''))) {
            errors.push('Invalid phone format');
        }
    }

    // Name validation
    if (piiData.firstName && piiData.firstName.length > 100) {
        errors.push('First name too long');
    }
    if (piiData.lastName && piiData.lastName.length > 100) {
        errors.push('Last name too long');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize PII data before storage
 */
export function sanitizePII(piiData: PIIField): PIIField {
    const sanitized: PIIField = {};

    if (piiData.email) {
        sanitized.email = piiData.email.toLowerCase().trim();
    }

    if (piiData.phone) {
        // Remove all non-digit characters except +
        sanitized.phone = piiData.phone.replace(/[^\d\+]/g, '');
    }

    if (piiData.firstName) {
        sanitized.firstName = piiData.firstName.trim();
    }

    if (piiData.lastName) {
        sanitized.lastName = piiData.lastName.trim();
    }

    if (piiData.address) {
        sanitized.address = piiData.address.trim();
    }

    if (piiData.cityState) {
        sanitized.cityState = piiData.cityState.trim();
    }

    if (piiData.country) {
        sanitized.country = piiData.country.trim();
    }

    return sanitized;
}

/**
 * Check if PII data has been properly encrypted
 */
export function isPIIEncrypted(data: any): boolean {
    if (!data || typeof data !== 'object') {
        return false;
    }

    // Check for encrypted field patterns
    const encryptedFields = [
        'email_encrypted',
        'phone_encrypted',
        'firstName_encrypted',
        'lastName_encrypted',
        'address_encrypted'
    ];

    return encryptedFields.some(field => data[field] && typeof data[field] === 'string');
}

/**
 * Generate environment variable setup instructions
 */
export function getEnvironmentSetupInstructions(): string {
    return `
# PII Security Environment Variables Required

# Generate a 32-byte (64 hex character) encryption key
PII_ENCRYPTION_KEY=your-64-character-hex-encryption-key

# Generate a secure salt (minimum 32 characters)
PII_HASH_SALT=your-secure-salt-minimum-32-characters

# Example generation commands:
# PII_ENCRYPTION_KEY=$(openssl rand -hex 32)
# PII_HASH_SALT=$(openssl rand -base64 32)

# Store these securely and never commit to version control!
  `.trim();
}
