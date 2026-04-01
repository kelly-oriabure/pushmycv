import { createSupabaseAdminClient } from '@/lib/config/supabase';
import { processPII, generateSecureHash, type PIIField } from '@/lib/security/piiEncryption';

/**
 * PII Data Migration Utility
 * 
 * This utility migrates existing plain text PII data to encrypted storage
 * with secure salted hashes. It should be run once during the security upgrade.
 */

export interface MigrationResult {
    success: boolean;
    migratedRecords: number;
    errors: string[];
    warnings: string[];
}

export class PIIDataMigration {
    private supabase = createSupabaseAdminClient();

    /**
     * Migrate personal details from plain text to encrypted storage
     */
    async migratePersonalDetails(): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: true,
            migratedRecords: 0,
            errors: [],
            warnings: []
        };

        try {
            console.log('Starting personal details migration...');

            // Get all existing personal details
            const { data: existingRecords, error: fetchError } = await this.supabase
                .from('personal_details')
                .select('*');

            if (fetchError) {
                result.errors.push(`Failed to fetch existing records: ${fetchError.message}`);
                result.success = false;
                return result;
            }

            if (!existingRecords || existingRecords.length === 0) {
                console.log('No personal details records to migrate');
                return result;
            }

            console.log(`Found ${existingRecords.length} personal details records to migrate`);

            // Migrate each record
            for (const record of existingRecords) {
                try {
                    // Prepare PII data
                    const piiData: PIIField = {
                        email: record.email || undefined,
                        phone: record.phone || undefined,
                        firstName: record.first_name || undefined,
                        lastName: record.last_name || undefined,
                        address: record.address || undefined,
                        cityState: record.city_state || undefined,
                        country: record.country || undefined
                    };

                    // Process PII (encrypt and hash)
                    const { encrypted, hashes } = processPII(piiData);

                    // Create secure record
                    const secureRecord = {
                        resume_id: record.resume_id,
                        job_title: record.job_title,
                        photo_url: record.photo_url,
                        ...encrypted,
                        ...hashes,
                        created_at: record.created_at,
                        updated_at: new Date().toISOString()
                    };

                    // Insert into secure table
                    const { error: insertError } = await this.supabase
                        .from('personal_details_secure')
                        .insert(secureRecord);

                    if (insertError) {
                        result.errors.push(`Failed to migrate record ${record.id}: ${insertError.message}`);
                        continue;
                    }

                    result.migratedRecords++;

                } catch (error) {
                    result.errors.push(`Error migrating record ${record.id}: ${error}`);
                }
            }

            console.log(`Personal details migration completed: ${result.migratedRecords} records migrated`);

        } catch (error) {
            result.errors.push(`Migration failed: ${error}`);
            result.success = false;
        }

        return result;
    }

    /**
     * Migrate resume uploads from plain text to encrypted storage
     */
    async migrateResumeUploads(): Promise<MigrationResult> {
        const result: MigrationResult = {
            success: true,
            migratedRecords: 0,
            errors: [],
            warnings: []
        };

        try {
            console.log('Starting resume uploads migration...');

            // Get all existing resume uploads
            const { data: existingRecords, error: fetchError } = await this.supabase
                .from('resume_uploads')
                .select('*');

            if (fetchError) {
                result.errors.push(`Failed to fetch existing records: ${fetchError.message}`);
                result.success = false;
                return result;
            }

            if (!existingRecords || existingRecords.length === 0) {
                console.log('No resume upload records to migrate');
                return result;
            }

            console.log(`Found ${existingRecords.length} resume upload records to migrate`);

            // Migrate each record
            for (const record of existingRecords) {
                try {
                    // Process extracted PII
                    const piiData: PIIField = {
                        email: record.extracted_email || undefined,
                        phone: record.extracted_phone || undefined
                    };

                    const { encrypted, hashes } = processPII(piiData);

                    // Generate secure content hash
                    const secureContentHash = record.extracted_text
                        ? generateSecureHash(record.extracted_text, 'content')
                        : record.content_hash;

                    // Create secure record
                    const secureRecord = {
                        user_id: record.user_id,
                        file_name: record.file_name,
                        file_path: record.file_path,
                        file_type: record.file_type,
                        file_size: record.file_size,
                        resume_url: record.resume_url,
                        pdf_url: record.pdf_url,
                        image_url: record.image_url,
                        content_hash: secureContentHash,
                        email_hash: hashes.email_hash,
                        phone_hash: hashes.phone_hash,
                        composite_hash: hashes.composite_hash,
                        extracted_email_encrypted: encrypted.email_encrypted,
                        extracted_phone_encrypted: encrypted.phone_encrypted,
                        extracted_text: record.extracted_text,
                        status: record.status || 'uploaded',
                        created_at: record.created_at,
                        updated_at: new Date().toISOString()
                    };

                    // Insert into secure table
                    const { error: insertError } = await this.supabase
                        .from('resume_uploads_secure')
                        .insert(secureRecord);

                    if (insertError) {
                        result.errors.push(`Failed to migrate record ${record.id}: ${insertError.message}`);
                        continue;
                    }

                    result.migratedRecords++;

                } catch (error) {
                    result.errors.push(`Error migrating record ${record.id}: ${error}`);
                }
            }

            console.log(`Resume uploads migration completed: ${result.migratedRecords} records migrated`);

        } catch (error) {
            result.errors.push(`Migration failed: ${error}`);
            result.success = false;
        }

        return result;
    }

    /**
     * Run complete PII migration
     */
    async runCompleteMigration(): Promise<{
        personalDetails: MigrationResult;
        resumeUploads: MigrationResult;
        overall: { success: boolean; totalMigrated: number; totalErrors: number };
    }> {
        console.log('Starting complete PII data migration...');

        const personalDetailsResult = await this.migratePersonalDetails();
        const resumeUploadsResult = await this.migrateResumeUploads();

        const overall = {
            success: personalDetailsResult.success && resumeUploadsResult.success,
            totalMigrated: personalDetailsResult.migratedRecords + resumeUploadsResult.migratedRecords,
            totalErrors: personalDetailsResult.errors.length + resumeUploadsResult.errors.length
        };

        console.log('PII migration completed:', {
            personalDetails: personalDetailsResult.migratedRecords,
            resumeUploads: resumeUploadsResult.migratedRecords,
            totalMigrated: overall.totalMigrated,
            totalErrors: overall.totalErrors
        });

        return {
            personalDetails: personalDetailsResult,
            resumeUploads: resumeUploadsResult,
            overall
        };
    }

    /**
     * Verify migration integrity
     */
    async verifyMigration(): Promise<{
        personalDetailsMatch: boolean;
        resumeUploadsMatch: boolean;
        details: string[];
    }> {
        const details: string[] = [];

        try {
            // Check personal details counts
            const { count: originalCount } = await this.supabase
                .from('personal_details')
                .select('*', { count: 'exact', head: true });

            const { count: secureCount } = await this.supabase
                .from('personal_details_secure')
                .select('*', { count: 'exact', head: true });

            const personalDetailsMatch = originalCount === secureCount;
            details.push(`Personal details: ${originalCount} original, ${secureCount} secure`);

            // Check resume uploads counts
            const { count: originalUploadsCount } = await this.supabase
                .from('resume_uploads')
                .select('*', { count: 'exact', head: true });

            const { count: secureUploadsCount } = await this.supabase
                .from('resume_uploads_secure')
                .select('*', { count: 'exact', head: true });

            const resumeUploadsMatch = originalUploadsCount === secureUploadsCount;
            details.push(`Resume uploads: ${originalUploadsCount} original, ${secureUploadsCount} secure`);

            return {
                personalDetailsMatch,
                resumeUploadsMatch,
                details
            };

        } catch (error) {
            details.push(`Verification error: ${error}`);
            return {
                personalDetailsMatch: false,
                resumeUploadsMatch: false,
                details
            };
        }
    }

    /**
     * Clean up old tables after successful migration
     * WARNING: This permanently deletes the old plain text data
     */
    async cleanupOldTables(): Promise<{ success: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            console.log('Cleaning up old PII tables...');

            // Verify migration first
            const verification = await this.verifyMigration();
            if (!verification.personalDetailsMatch || !verification.resumeUploadsMatch) {
                errors.push('Migration verification failed. Cannot safely clean up old tables.');
                return { success: false, errors };
            }

            // Drop old tables (commented out for safety - uncomment when ready)
            /*
            await this.supabase.rpc('drop_table_if_exists', { table_name: 'personal_details' });
            await this.supabase.rpc('drop_table_if_exists', { table_name: 'resume_uploads' });
            */

            console.log('Old tables cleanup completed (commented out for safety)');
            return { success: true, errors };

        } catch (error) {
            errors.push(`Cleanup error: ${error}`);
            return { success: false, errors };
        }
    }
}

/**
 * Utility function to run migration from command line or API
 */
export async function runPIIDataMigration(): Promise<any> {
    const migration = new PIIDataMigration();

    try {
        const results = await migration.runCompleteMigration();
        const verification = await migration.verifyMigration();

        return {
            migration: results,
            verification,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            error: `Migration failed: ${error}`,
            timestamp: new Date().toISOString()
        };
    }
}
