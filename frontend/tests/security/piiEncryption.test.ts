import {
    encryptPII,
    decryptPII,
    hashPII,
    processPII,
    decryptPIIFields,
    validatePII,
    sanitizePII,
    generateSecureHash,
    type PIIField,
    type EncryptedPII
} from '@/lib/security/piiEncryption';

// Mock environment variables
const originalEnv = process.env;

describe('PII Encryption and Security', () => {
    beforeEach(() => {
        // Set up test environment variables
        process.env = {
            ...originalEnv,
            PII_ENCRYPTION_KEY: 'a'.repeat(64), // 32 bytes in hex
            PII_HASH_SALT: 'test-salt-minimum-32-characters-long'
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('encryptPII and decryptPII', () => {
        it('should encrypt and decrypt PII data correctly', () => {
            const testData = 'john.doe@example.com';
            const encrypted = encryptPII(testData);
            const decrypted = decryptPII(encrypted);

            expect(encrypted).not.toBe(testData);
            expect(encrypted).toMatch(/^[a-f0-9]+$/); // Should be hex string
            expect(decrypted).toBe(testData);
        });

        it('should handle empty strings', () => {
            expect(encryptPII('')).toBe('');
            expect(decryptPII('')).toBe('');
        });

        it('should throw error for missing encryption key', () => {
            delete process.env.PII_ENCRYPTION_KEY;
            expect(() => encryptPII('test')).toThrow('PII_ENCRYPTION_KEY environment variable is required');
        });

        it('should throw error for invalid encryption key length', () => {
            process.env.PII_ENCRYPTION_KEY = 'short';
            expect(() => encryptPII('test')).toThrow('PII_ENCRYPTION_KEY must be 64 characters');
        });
    });

    describe('hashPII', () => {
        it('should generate consistent hashes for same input', () => {
            const testData = 'john.doe@example.com';
            const hash1 = hashPII(testData, 'email');
            const hash2 = hashPII(testData, 'email');

            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
        });

        it('should generate different hashes for different field types', () => {
            const testData = 'john.doe@example.com';
            const emailHash = hashPII(testData, 'email');
            const phoneHash = hashPII(testData, 'phone');

            expect(emailHash).not.toBe(phoneHash);
        });

        it('should handle empty strings', () => {
            expect(hashPII('', 'email')).toBe('');
        });

        it('should throw error for missing salt', () => {
            delete process.env.PII_HASH_SALT;
            expect(() => hashPII('test', 'email')).toThrow('PII_HASH_SALT environment variable is required');
        });

        it('should throw error for short salt', () => {
            process.env.PII_HASH_SALT = 'short';
            expect(() => hashPII('test', 'email')).toThrow('PII_HASH_SALT must be at least 32 characters');
        });
    });

    describe('processPII', () => {
        it('should process complete PII data', () => {
            const piiData: PIIField = {
                email: 'john.doe@example.com',
                phone: '+1234567890',
                firstName: 'John',
                lastName: 'Doe',
                address: '123 Main St',
                cityState: 'New York, NY',
                country: 'USA'
            };

            const result = processPII(piiData);

            // Check encrypted fields
            expect(result.encrypted.email_encrypted).toBeTruthy();
            expect(result.encrypted.phone_encrypted).toBeTruthy();
            expect(result.encrypted.firstName_encrypted).toBeTruthy();
            expect(result.encrypted.lastName_encrypted).toBeTruthy();
            expect(result.encrypted.address_encrypted).toBeTruthy();

            // Check hashes
            expect(result.hashes.email_hash).toBeTruthy();
            expect(result.hashes.phone_hash).toBeTruthy();
            expect(result.hashes.name_hash).toBeTruthy();
            expect(result.hashes.address_hash).toBeTruthy();
            expect(result.hashes.composite_hash).toBeTruthy();

            // Verify hashes are different
            expect(result.hashes.email_hash).not.toBe(result.hashes.phone_hash);
            expect(result.hashes.name_hash).not.toBe(result.hashes.address_hash);
        });

        it('should handle partial PII data', () => {
            const piiData: PIIField = {
                email: 'john.doe@example.com',
                firstName: 'John'
            };

            const result = processPII(piiData);

            expect(result.encrypted.email_encrypted).toBeTruthy();
            expect(result.encrypted.firstName_encrypted).toBeTruthy();
            expect(result.encrypted.phone_encrypted).toBeFalsy();
            expect(result.hashes.email_hash).toBeTruthy();
            expect(result.hashes.phone_hash).toBe('');
        });

        it('should handle empty PII data', () => {
            const piiData: PIIField = {};
            const result = processPII(piiData);

            expect(result.encrypted).toEqual({});
            expect(result.hashes.email_hash).toBe('');
            expect(result.hashes.phone_hash).toBe('');
            expect(result.hashes.composite_hash).toBe('');
        });
    });

    describe('decryptPIIFields', () => {
        it('should decrypt all encrypted fields', () => {
            const originalPII: PIIField = {
                email: 'john.doe@example.com',
                phone: '+1234567890',
                firstName: 'John',
                lastName: 'Doe'
            };

            const { encrypted } = processPII(originalPII);
            const decrypted = decryptPIIFields(encrypted);

            expect(decrypted.email).toBe(originalPII.email);
            expect(decrypted.phone).toBe(originalPII.phone);
            expect(decrypted.firstName).toBe(originalPII.firstName);
            expect(decrypted.lastName).toBe(originalPII.lastName);
        });

        it('should handle empty encrypted data', () => {
            const encrypted: EncryptedPII = {};
            const decrypted = decryptPIIFields(encrypted);

            expect(decrypted).toEqual({});
        });
    });

    describe('validatePII', () => {
        it('should validate correct PII data', () => {
            const piiData: PIIField = {
                email: 'john.doe@example.com',
                phone: '+1234567890',
                firstName: 'John',
                lastName: 'Doe'
            };

            const result = validatePII(piiData);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid email', () => {
            const piiData: PIIField = {
                email: 'invalid-email'
            };

            const result = validatePII(piiData);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid email format');
        });

        it('should reject invalid phone', () => {
            const piiData: PIIField = {
                phone: 'invalid-phone'
            };

            const result = validatePII(piiData);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid phone format');
        });

        it('should reject names that are too long', () => {
            const piiData: PIIField = {
                firstName: 'a'.repeat(101)
            };

            const result = validatePII(piiData);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('First name too long');
        });
    });

    describe('sanitizePII', () => {
        it('should sanitize PII data correctly', () => {
            const piiData: PIIField = {
                email: '  JOHN.DOE@EXAMPLE.COM  ',
                phone: '+1 (234) 567-8900',
                firstName: '  John  ',
                lastName: '  Doe  '
            };

            const sanitized = sanitizePII(piiData);

            expect(sanitized.email).toBe('john.doe@example.com');
            expect(sanitized.phone).toBe('+12345678900');
            expect(sanitized.firstName).toBe('John');
            expect(sanitized.lastName).toBe('Doe');
        });

        it('should handle empty data', () => {
            const piiData: PIIField = {};
            const sanitized = sanitizePII(piiData);

            expect(sanitized).toEqual({});
        });
    });

    describe('generateSecureHash', () => {
        it('should generate consistent hashes for same input', () => {
            const testData = 'test data';
            const hash1 = generateSecureHash(testData, 'email');
            const hash2 = generateSecureHash(testData, 'email');

            expect(hash1).toBe(hash2);
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should generate different hashes for different types', () => {
            const testData = 'test data';
            const emailHash = generateSecureHash(testData, 'email');
            const phoneHash = generateSecureHash(testData, 'phone');

            expect(emailHash).not.toBe(phoneHash);
        });

        it('should handle empty strings', () => {
            expect(generateSecureHash('', 'email')).toBe('');
        });
    });

    describe('Security Properties', () => {
        it('should produce different hashes for same data with different salts', () => {
            const testData = 'john.doe@example.com';

            // First hash with current salt
            const hash1 = hashPII(testData, 'email');

            // Change salt
            process.env.PII_HASH_SALT = 'different-salt-minimum-32-characters-long';
            const hash2 = hashPII(testData, 'email');

            expect(hash1).not.toBe(hash2);
        });

        it('should produce different encrypted data for same input', () => {
            const testData = 'john.doe@example.com';
            const encrypted1 = encryptPII(testData);
            const encrypted2 = encryptPII(testData);

            // Should be different due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But should decrypt to same value
            expect(decryptPII(encrypted1)).toBe(testData);
            expect(decryptPII(encrypted2)).toBe(testData);
        });

        it('should be resistant to rainbow table attacks', () => {
            const commonEmails = [
                'admin@example.com',
                'test@example.com',
                'user@example.com'
            ];

            const hashes = commonEmails.map(email => hashPII(email, 'email'));

            // All hashes should be different and not match common rainbow table values
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(hashes.length);

            // Hashes should not be simple transformations of input
            hashes.forEach((hash, index) => {
                expect(hash).not.toContain(commonEmails[index]);
                expect(hash).not.toBe(commonEmails[index].toLowerCase());
            });
        });
    });
});
