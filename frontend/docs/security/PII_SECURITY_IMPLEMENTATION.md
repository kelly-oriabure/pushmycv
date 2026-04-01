# PII Security Implementation Guide

## Overview

This document describes the comprehensive PII (Personally Identifiable Information) security system implemented to address critical security vulnerabilities in the JobEazy application. The system provides encrypted storage, secure hashing with salts, and GDPR/CCPA compliance features.

## 🚨 Critical Issues Resolved

### 1. **NO HASH SALTING** ❌ → ✅ **SECURE SALTED HASHES**
- **Before**: Email/phone hashes used plain SHA256 without salts
- **After**: All hashes use cryptographically secure salts
- **Impact**: Prevents rainbow table attacks

### 2. **PLAIN TEXT PII STORAGE** ❌ → ✅ **AES-256-GCM ENCRYPTION**
- **Before**: Emails, phones, names stored in plain text
- **After**: All PII encrypted with AES-256-GCM
- **Impact**: GDPR/CCPA compliance, data breach protection

### 3. **GDPR/CCPA VIOLATIONS** ❌ → ✅ **FULL COMPLIANCE**
- **Before**: Personal data stored without encryption
- **After**: Encrypted storage with right to erasure support
- **Impact**: Legal compliance, reduced liability

## Architecture

### Core Components

#### 1. **PII Encryption Service** (`app/lib/security/piiEncryption.ts`)
```typescript
// Encrypt PII data
const encrypted = encryptPII('john.doe@example.com');

// Decrypt PII data
const decrypted = decryptPII(encrypted);

// Generate secure hash with salt
const hash = hashPII('john.doe@example.com', 'email');

// Process complete PII object
const { encrypted, hashes } = processPII(piiData);
```

#### 2. **Secure PII Repository** (`app/lib/repositories/securePIIRepository.ts`)
```typescript
const piiRepo = new SecurePIIRepository();

// Store encrypted personal details
await piiRepo.upsertPersonalDetails(resumeId, piiData, jobTitle);

// Retrieve and decrypt personal details
const details = await piiRepo.getPersonalDetails(resumeId);

// Create secure resume upload
await piiRepo.createResumeUpload(userId, fileData, extractedData);
```

#### 3. **Secure PDF Extractor** (`app/lib/text-extraction/securePdfExtractor.ts`)
```typescript
// Extract text with secure hashing
const result = await extractTextFromPdfSecure(buffer);

// Result includes secure hashes with salts
console.log(result.emailHash); // Salted hash
console.log(result.phoneHash); // Salted hash
console.log(result.compositeHash); // Salted composite hash
```

### Database Schema

#### Secure Tables Created

**`personal_details_secure`**
```sql
CREATE TABLE personal_details_secure (
    id UUID PRIMARY KEY,
    resume_id UUID REFERENCES resumes(id),
    
    -- Encrypted PII fields
    email_encrypted TEXT,
    phone_encrypted TEXT,
    first_name_encrypted TEXT,
    last_name_encrypted TEXT,
    address_encrypted TEXT,
    city_state_encrypted TEXT,
    country_encrypted TEXT,
    
    -- Secure hashes (with salts)
    email_hash TEXT,
    phone_hash TEXT,
    name_hash TEXT,
    address_hash TEXT,
    composite_hash TEXT,
    
    -- Non-PII fields
    job_title TEXT,
    photo_url TEXT,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**`resume_uploads_secure`**
```sql
CREATE TABLE resume_uploads_secure (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    
    -- File information
    file_name TEXT,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    resume_url TEXT,
    pdf_url TEXT,
    
    -- Secure hashes (replacing old unsalted hashes)
    content_hash TEXT,
    email_hash TEXT,
    phone_hash TEXT,
    composite_hash TEXT,
    
    -- Encrypted extracted PII
    extracted_email_encrypted TEXT,
    extracted_phone_encrypted TEXT,
    
    -- Non-PII extracted data
    extracted_text TEXT,
    
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Security Features

### 1. **AES-256-GCM Encryption**
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: Environment variable `PII_ENCRYPTION_KEY`
- **IV**: Random 128-bit IV for each encryption
- **Authentication**: Built-in authentication tag prevents tampering

### 2. **Salted Hashing**
- **Algorithm**: SHA-256 with HMAC-style salting
- **Salt Source**: Environment variable `PII_HASH_SALT`
- **Field-Specific Salts**: Different salts for email, phone, name, address
- **Rainbow Table Resistance**: Unique salts prevent precomputed attacks

### 3. **Data Validation**
- **Email Validation**: RFC-compliant email format checking
- **Phone Validation**: International phone number format validation
- **Length Limits**: Prevents buffer overflow attacks
- **Sanitization**: Removes dangerous characters and normalizes data

### 4. **Row Level Security (RLS)**
- **User Isolation**: Users can only access their own data
- **Admin Override**: Service role can access all data for maintenance
- **Audit Trail**: All access logged for compliance

## Environment Setup

### Required Environment Variables

```bash
# Generate a 32-byte (64 hex character) encryption key
PII_ENCRYPTION_KEY=your-64-character-hex-encryption-key

# Generate a secure salt (minimum 32 characters)
PII_HASH_SALT=your-secure-salt-minimum-32-characters

# Example generation commands:
PII_ENCRYPTION_KEY=$(openssl rand -hex 32)
PII_HASH_SALT=$(openssl rand -base64 32)
```

### Key Generation Commands

```bash
# Generate encryption key (64 hex characters)
openssl rand -hex 32

# Generate hash salt (32+ characters)
openssl rand -base64 32

# Verify key length
echo $PII_ENCRYPTION_KEY | wc -c  # Should be 65 (64 chars + newline)
```

## Migration Process

### 1. **Database Migration**
```bash
# Apply the secure tables migration
supabase db push

# Or manually run:
psql -f supabase/migrations/020_create_secure_pii_tables.sql
```

### 2. **Data Migration**
```typescript
import { PIIDataMigration } from '@/lib/migrations/piiDataMigration';

const migration = new PIIDataMigration();

// Run complete migration
const results = await migration.runCompleteMigration();

// Verify migration
const verification = await migration.verifyMigration();

// Clean up old tables (after verification)
await migration.cleanupOldTables();
```

### 3. **API Route Updates**
```typescript
// Old route (insecure)
app/api/upload-to-supabase/route.ts

// New route (secure)
app/api/upload-secure-pii/route.ts
```

## Usage Examples

### 1. **Storing Personal Details**
```typescript
import { SecurePIIRepository } from '@/lib/repositories/securePIIRepository';

const piiRepo = new SecurePIIRepository();

const piiData = {
  email: 'john.doe@example.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  address: '123 Main St',
  cityState: 'New York, NY',
  country: 'USA'
};

// Store with encryption and secure hashing
await piiRepo.upsertPersonalDetails('resume-123', piiData, 'Software Engineer');
```

### 2. **Retrieving Personal Details**
```typescript
// Retrieve and automatically decrypt
const details = await piiRepo.getPersonalDetails('resume-123');

console.log(details.pii.email); // 'john.doe@example.com' (decrypted)
console.log(details.pii.phone); // '+1234567890' (decrypted)
console.log(details.jobTitle);  // 'Software Engineer'
```

### 3. **Duplicate Detection**
```typescript
// Check for duplicates using secure hashes
const duplicateCheck = await piiRepo.detectDuplicateResume(
  hashes,
  contentHash,
  userId
);

if (duplicateCheck.isDuplicate) {
  console.log('Duplicate found:', duplicateCheck.existingRecord.id);
}
```

### 4. **PDF Processing**
```typescript
import { extractTextFromPdfSecure } from '@/lib/text-extraction/securePdfExtractor';

const buffer = fs.readFileSync('resume.pdf');
const result = await extractTextFromPdfSecure(buffer);

// Secure hashes with salts
console.log(result.emailHash);     // Salted hash of emails
console.log(result.phoneHash);     // Salted hash of phones
console.log(result.compositeHash); // Salted composite hash
```

## Security Best Practices

### 1. **Key Management**
- Store encryption keys in environment variables
- Never commit keys to version control
- Rotate keys periodically
- Use different keys for different environments

### 2. **Access Control**
- Implement proper authentication
- Use Row Level Security (RLS)
- Audit all PII access
- Implement rate limiting

### 3. **Data Handling**
- Always validate PII before processing
- Sanitize data before storage
- Use secure hashing for duplicate detection
- Implement data retention policies

### 4. **Compliance**
- Implement right to erasure (GDPR Article 17)
- Provide data portability (GDPR Article 20)
- Maintain audit logs
- Regular security assessments

## Testing

### Unit Tests
```bash
# Run PII security tests
npm test tests/security/piiEncryption.test.ts

# Run secure repository tests
npm test tests/repositories/securePIIRepository.test.ts
```

### Integration Tests
```bash
# Test complete PII flow
npm test tests/integration/piiSecurity.test.ts
```

### Security Tests
```bash
# Test encryption/decryption
npm test tests/security/encryption.test.ts

# Test hash security
npm test tests/security/hashing.test.ts
```

## Monitoring and Alerting

### 1. **Security Metrics**
- Failed decryption attempts
- Unusual access patterns
- Key rotation events
- Data breach indicators

### 2. **Compliance Monitoring**
- PII access logs
- Data retention compliance
- Right to erasure requests
- Audit trail completeness

### 3. **Performance Monitoring**
- Encryption/decryption latency
- Hash generation performance
- Database query performance
- Storage usage

## Troubleshooting

### Common Issues

#### 1. **Encryption Key Errors**
```
Error: PII_ENCRYPTION_KEY environment variable is required
```
**Solution**: Set the `PII_ENCRYPTION_KEY` environment variable with a 64-character hex string.

#### 2. **Hash Salt Errors**
```
Error: PII_HASH_SALT must be at least 32 characters
```
**Solution**: Set the `PII_HASH_SALT` environment variable with at least 32 characters.

#### 3. **Decryption Failures**
```
Error: Failed to decrypt PII data
```
**Solution**: Verify the encryption key matches the one used for encryption.

#### 4. **Migration Issues**
```
Error: Migration verification failed
```
**Solution**: Check that all data was migrated correctly before cleaning up old tables.

### Debug Mode
```typescript
// Enable debug logging
process.env.PII_DEBUG = 'true';

// Check encryption status
import { isPIIEncrypted } from '@/lib/security/piiEncryption';
console.log('Is encrypted:', isPIIEncrypted(data));
```

## Future Enhancements

### 1. **Advanced Encryption**
- Field-level encryption keys
- Hardware security modules (HSM)
- Key escrow systems

### 2. **Enhanced Compliance**
- Automated GDPR compliance checks
- Data lineage tracking
- Privacy impact assessments

### 3. **Performance Optimization**
- Encryption caching
- Batch processing
- Async encryption/decryption

### 4. **Security Monitoring**
- Real-time threat detection
- Anomaly detection
- Automated incident response

## Conclusion

The PII security implementation provides:

✅ **Encrypted Storage**: All PII encrypted with AES-256-GCM  
✅ **Secure Hashing**: Salted hashes prevent rainbow table attacks  
✅ **GDPR/CCPA Compliance**: Right to erasure and data protection  
✅ **Audit Trail**: Complete access logging for compliance  
✅ **Performance**: Optimized for production use  
✅ **Maintainability**: Clean, documented, testable code  

This implementation eliminates the critical security vulnerabilities and provides a robust foundation for handling PII data securely and compliantly.
