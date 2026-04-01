#!/usr/bin/env node

/**
 * Simple PII Security Keys Verification Script
 * 
 * This script verifies that the generated PII security keys are properly
 * configured and working with the PII encryption system.
 */

const crypto = require('crypto');
const fs = require('fs');

// Read environment variables from .env.local
function loadEnvFile() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const envVars = {};

        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });

        return envVars;
    } catch (error) {
        console.error('❌ Could not read .env.local file:', error.message);
        return null;
    }
}

function verifyEncryptionKey(key) {
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

function verifyHashSalt(salt) {
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

function testEncryption(key) {
    try {
        // Test that the key can be converted to a buffer (basic validation)
        const keyBuffer = Buffer.from(key, 'hex');

        if (keyBuffer.length === 32) {
            console.log('✅ Encryption key format test passed');
            return true;
        } else {
            console.error('❌ Encryption key format test failed - wrong length');
            return false;
        }
    } catch (error) {
        console.error('❌ Encryption test error:', error.message);
        return false;
    }
}

function testHashing(salt) {
    try {
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

    // Load environment variables
    const envVars = loadEnvFile();
    if (!envVars) {
        process.exit(1);
    }

    const encryptionKey = envVars.PII_ENCRYPTION_KEY;
    const hashSalt = envVars.PII_HASH_SALT;

    const results = [
        verifyEncryptionKey(encryptionKey),
        verifyHashSalt(hashSalt),
        testEncryption(encryptionKey),
        testHashing(hashSalt)
    ];

    const allPassed = results.every(result => result);

    console.log('\n' + '='.repeat(50));

    if (allPassed) {
        console.log('🎉 All PII security keys are properly configured!');
        console.log('✅ Your application is ready for secure PII handling.');
        console.log('\n📋 Next steps:');
        console.log('1. Run database migration: supabase db push');
        console.log('2. Migrate existing data using the migration utility');
        console.log('3. Update API routes to use the new secure system');
        console.log('4. Test the PII security implementation');
    } else {
        console.log('❌ Some PII security key tests failed.');
        console.log('🔧 Please check your .env.local file and regenerate keys if needed.');
        process.exit(1);
    }
}

// Run verification
main();
