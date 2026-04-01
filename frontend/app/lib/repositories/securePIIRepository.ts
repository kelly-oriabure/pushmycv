import { getSupabaseClient } from '@/integrations/supabase/client';
import {
    processPII,
    decryptPIIFields,
    validatePII,
    sanitizePII,
    generateSecureHash,
    type PIIField,
    type EncryptedPII,
    type PIIHashes
} from '@/lib/security/piiEncryption';

/**
 * Secure PII Repository
 * 
 * Handles encrypted storage and retrieval of Personally Identifiable Information
 * with proper validation, sanitization, and GDPR/CCPA compliance.
 */

export interface PersonalDetailsRecord {
    id?: string;
    resume_id: string;
    job_title?: string;
    // Encrypted PII fields
    email_encrypted?: string;
    phone_encrypted?: string;
    firstName_encrypted?: string;
    lastName_encrypted?: string;
    address_encrypted?: string;
    cityState_encrypted?: string;
    country_encrypted?: string;
    // Secure hashes for duplicate detection
    email_hash?: string;
    phone_hash?: string;
    name_hash?: string;
    address_hash?: string;
    composite_hash?: string;
    // Non-PII fields
    photo_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ResumeUploadRecord {
    id?: string;
    user_id: string;
    file_name?: string;
    file_path?: string;
    file_type?: string;
    file_size?: number;
    resume_url?: string;
    pdf_url?: string;
    image_url?: string;
    // Secure hashes (replacing old unsalted hashes)
    content_hash?: string;
    email_hash?: string;
    phone_hash?: string;
    composite_hash?: string;
    // Encrypted extracted PII
    extracted_email_encrypted?: string;
    extracted_phone_encrypted?: string;
    // Non-PII fields
    extracted_text?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export class SecurePIIRepository {
    private supabase = getSupabaseClient();

    /**
     * Create or update personal details with encrypted PII
     */
    async upsertPersonalDetails(
        resumeId: string,
        piiData: PIIField,
        jobTitle?: string,
        photoUrl?: string
    ): Promise<PersonalDetailsRecord> {
        try {
            // Validate and sanitize PII data
            const validation = validatePII(piiData);
            if (!validation.valid) {
                throw new Error(`PII validation failed: ${validation.errors.join(', ')}`);
            }

            const sanitizedPII = sanitizePII(piiData);

            // Process PII (encrypt and hash)
            const { encrypted, hashes } = processPII(sanitizedPII);

            // Prepare database record
            const record: Partial<PersonalDetailsRecord> = {
                resume_id: resumeId,
                job_title: jobTitle || undefined,
                photo_url: photoUrl || undefined,
                ...encrypted,
                ...hashes,
                updated_at: new Date().toISOString()
            };

            // Check if record exists
            const { data: existing } = await this.supabase
                .from('personal_details_secure' as any)
                .select('id')
                .eq('resume_id', resumeId)
                .single();

            let result;
            if (existing) {
                // Update existing record
                const { data, error } = await this.supabase
                    .from('personal_details_secure' as any)
                    .update(record)
                    .eq('id', (existing as any).id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Create new record
                record.created_at = new Date().toISOString();
                const { data, error } = await this.supabase
                    .from('personal_details_secure' as any)
                    .insert(record)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return result as unknown as PersonalDetailsRecord;

        } catch (error) {
            console.error('Error in SecurePIIRepository.upsertPersonalDetails:', error);
            throw error;
        }
    }

    /**
     * Retrieve and decrypt personal details
     */
    async getPersonalDetails(resumeId: string): Promise<{ pii: PIIField; jobTitle?: string; photoUrl?: string } | null> {
        try {
            const { data, error } = await this.supabase
                .from('personal_details_secure' as any)
                .select('*')
                .eq('resume_id', resumeId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // No rows returned
                    return null;
                }
                throw error;
            }

            // Decrypt PII data
            const typedData = data as any;
            const encryptedData: EncryptedPII = {
                email_encrypted: typedData.email_encrypted,
                phone_encrypted: typedData.phone_encrypted,
                firstName_encrypted: typedData.firstName_encrypted,
                lastName_encrypted: typedData.lastName_encrypted,
                address_encrypted: typedData.address_encrypted,
                cityState_encrypted: typedData.cityState_encrypted,
                country_encrypted: typedData.country_encrypted
            };

            const decryptedPII = decryptPIIFields(encryptedData);

            return {
                pii: decryptedPII,
                jobTitle: typedData.job_title,
                photoUrl: typedData.photo_url
            };

        } catch (error) {
            console.error('Error in SecurePIIRepository.getPersonalDetails:', error);
            throw error;
        }
    }

    /**
     * Delete personal details (GDPR right to erasure)
     */
    async deletePersonalDetails(resumeId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('personal_details_secure' as any)
                .delete()
                .eq('resume_id', resumeId);

            if (error) throw error;

        } catch (error) {
            console.error('Error in SecurePIIRepository.deletePersonalDetails:', error);
            throw error;
        }
    }

    /**
     * Create secure resume upload record with encrypted PII
     */
    async createResumeUpload(
        userId: string,
        fileData: {
            fileName: string;
            filePath: string;
            fileType: string;
            fileSize: number;
            resumeUrl: string;
            pdfUrl?: string;
            imageUrl?: string;
        },
        extractedData: {
            fullText: string;
            emails: string[];
            phones: string[];
            contentHash: string;
        }
    ): Promise<ResumeUploadRecord> {
        try {
            // Process extracted PII
            const piiData: PIIField = {
                email: extractedData.emails[0] || undefined,
                phone: extractedData.phones[0] || undefined
            };

            const { encrypted, hashes } = processPII(piiData);

            // Generate secure content hash
            const secureContentHash = this.generateSecureContentHash(extractedData.fullText);

            // Prepare database record
            const record: Partial<ResumeUploadRecord> = {
                user_id: userId,
                file_name: fileData.fileName,
                file_path: fileData.filePath,
                file_type: fileData.fileType,
                file_size: fileData.fileSize,
                resume_url: fileData.resumeUrl,
                pdf_url: fileData.pdfUrl,
                image_url: fileData.imageUrl,
                content_hash: secureContentHash,
                email_hash: hashes.email_hash,
                phone_hash: hashes.phone_hash,
                composite_hash: hashes.composite_hash,
                extracted_email_encrypted: encrypted.email_encrypted,
                extracted_phone_encrypted: encrypted.phone_encrypted,
                extracted_text: extractedData.fullText,
                status: 'uploaded',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .insert(record)
                .select()
                .single();

            if (error) throw error;

            return data as unknown as ResumeUploadRecord;

        } catch (error) {
            console.error('Error in SecurePIIRepository.createResumeUpload:', error);
            throw error;
        }
    }

    /**
     * Retrieve resume upload with decrypted PII
     */
    async getResumeUpload(uploadId: string, userId: string): Promise<ResumeUploadRecord | null> {
        try {
            const { data, error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .select('*')
                .eq('id', uploadId)
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }

            return data as unknown as ResumeUploadRecord;

        } catch (error) {
            console.error('Error in SecurePIIRepository.getResumeUpload:', error);
            throw error;
        }
    }

    /**
     * Decrypt PII from resume upload record
     */
    decryptResumeUploadPII(record: ResumeUploadRecord): { email?: string; phone?: string } {
        const encryptedData: EncryptedPII = {
            email_encrypted: record.extracted_email_encrypted,
            phone_encrypted: record.extracted_phone_encrypted
        };

        return decryptPIIFields(encryptedData);
    }

    /**
     * Detect duplicate resumes using secure hashes
     */
    async detectDuplicateResume(
        hashes: PIIHashes,
        contentHash: string,
        userId: string
    ): Promise<{ isDuplicate: boolean; existingRecord?: ResumeUploadRecord }> {
        try {
            // Check for duplicates using secure hashes
            const { data, error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .select('*')
                .eq('user_id', userId)
                .or(`composite_hash.eq.${hashes.composite_hash},content_hash.eq.${contentHash}`)
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                return {
                    isDuplicate: true,
                    existingRecord: data[0] as unknown as ResumeUploadRecord
                };
            }

            return { isDuplicate: false };

        } catch (error) {
            console.error('Error in SecurePIIRepository.detectDuplicateResume:', error);
            throw error;
        }
    }

    /**
     * Generate secure content hash with salt
     */
    private generateSecureContentHash(text: string): string {
        return generateSecureHash(text, 'content');
    }

    /**
     * Search resumes by secure hash (for duplicate detection)
     */
    async searchByHash(hashType: 'email' | 'phone' | 'composite', hashValue: string, userId: string): Promise<ResumeUploadRecord[]> {
        try {
            const hashColumn = `${hashType}_hash`;

            const { data, error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .select('*')
                .eq('user_id', userId)
                .eq(hashColumn, hashValue);

            if (error) throw error;

            return (data || []) as unknown as ResumeUploadRecord[];

        } catch (error) {
            console.error('Error in SecurePIIRepository.searchByHash:', error);
            throw error;
        }
    }

    /**
     * Get all resume uploads for a user (without decrypted PII)
     */
    async getUserResumeUploads(userId: string): Promise<ResumeUploadRecord[]> {
        try {
            const { data, error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []) as unknown as ResumeUploadRecord[];

        } catch (error) {
            console.error('Error in SecurePIIRepository.getUserResumeUploads:', error);
            throw error;
        }
    }

    /**
     * Update resume upload status
     */
    async updateResumeUploadStatus(uploadId: string, status: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('resume_uploads_secure' as any)
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', uploadId);

            if (error) throw error;

        } catch (error) {
            console.error('Error in SecurePIIRepository.updateResumeUploadStatus:', error);
            throw error;
        }
    }
}
