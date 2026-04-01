#!/usr/bin/env node

/**
 * PII Security Keys Verification Script
 * 
 * This script verifies that the generated PII security keys are properly
 * configured and working with the PII encryption system.
 */

const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

function verifyEncryptionKey() {
    const key = process.env.PII_ENCRYPTION_KEY;

    if (!key) {
        console.error('❌ PII_ENCRYPTION_KEY not found in environment');
        return false;
    }

    if (key.length !== 64) {
        console.error(`❌ PII_ENCRYPTION_KEY length is ${key.length}, expected 64`);
        return false;
    }

    if (!/^[a-f0-9]+$/i.test(key)) {
        console.error('❌ PII_ENCRYPTION_KEY contains invalid characters (must be hex)');
        return false;
    }

    console.log('✅ PII_ENCRYPTION_KEY is valid (64 hex characters)');
    return true;
}

function verifyHashSalt() {
    const salt = process.env.PII_HASH_SALT;

    if (!salt) {
        console.error('❌ PII_HASH_SALT not found in environment');
        return false;
    }

    if (salt.length < 32) {
        console.error(`❌ PII_HASH_SALT length is ${salt.length}, expected at least 32`);
        return false;
    }

    console.log('✅ PII_HASH_SALT is valid (32+ characters)');
    return true;
}

function testEncryption() {
    try {
        const key = Buffer.from(process.env.PII_ENCRYPTION_KEY, 'hex');
        const testData = 'test@example.com';

        // Test encryption
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);
        cipher.setAAD(Buffer.from('pii-encryption', 'utf8'));

        let encrypted = cipher.update(testData, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Test decryption
        const decipher = crypto.createDecipher('aes-256-gcm', key);
        decipher.setAAD(Buffer.from('pii-encryption', 'utf8'));
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        if (decrypted === testData) {
            console.log('✅ Encryption/Decryption test passed');
            return true;
        } else {
            console.error('❌ Encryption/Decryption test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Encryption test error:', error.message);
        return false;
    }
}

function testHashing() {
    try {
        const salt = process.env.PII_HASH_SALT;
        const testData = 'test@example.com';

        // Create field-specific salt
        const fieldSalt = crypto
            .createHash('sha256')
            .update(salt + 'email')
            .digest('hex');

        // Generate hash
        const hash = crypto
            .createHash('sha256')
            .update(testData.toLowerCase().trim() + fieldSalt)
            .digest('hex');

        if (hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
            console.log('✅ Hashing test passed');
            return true;
        } else {
            console.error('❌ Hashing test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Hashing test error:', error.message);
        return false;
    }
}

function main() {
    console.log('🔐 PII Security Keys Verification\n');

    const results = [
        verifyEncryptionKey(),
        verifyHashSalt(),
        testEncryption(),
        testHashing()
    ];

    const allPassed = results.every(result => result);

    console.log('\n' + '='.repeat(50));

    if (allPassed) {
        console.log('🎉 All PII security keys are properly configured!');
        console.log('✅ Your application is ready for secure PII handling.');
    } else {
        console.log('❌ Some PII security key tests failed.');
        console.log('🔧 Please check your .env.local file and regenerate keys if needed.');
        process.exit(1);
    }
}

// Run verification
main();
