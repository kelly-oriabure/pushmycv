const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateResumes() {
    try {
        console.log('Starting migration of resumes from old bucket to new location...');

        // Get all resume uploads from the database
        const { data: resumeUploads, error: fetchError } = await supabase
            .from('resume_uploads')
            .select('id, user_id, file_path, resume_url, pdf_url');

        if (fetchError) {
            console.error('Error fetching resume uploads:', fetchError);
            process.exit(1);
        }

        console.log(`Found ${resumeUploads.length} resume uploads to process`);

        let migratedCount = 0;

        // Process each resume upload
        for (const upload of resumeUploads) {
            try {
                // Check if the file is already in the new location
                if (upload.file_path.startsWith('resume-pdfs/')) {
                    console.log(`Skipping ${upload.id} - already migrated`);
                    continue;
                }

                // Get the old file path (just the filename in the old structure)
                const oldFilePath = upload.file_path;

                // Create new file path
                const newFilePath = `resume-pdfs/${oldFilePath}`;

                console.log(`Migrating ${upload.id} from ${oldFilePath} to ${newFilePath}`);

                // Download file from old location
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('resumes')
                    .download(oldFilePath);

                if (downloadError) {
                    console.error(`Error downloading file ${oldFilePath}:`, downloadError);
                    continue;
                }

                // Get file content type
                const contentType = fileData.type || 'application/pdf';

                // Upload to new location
                const { error: uploadError } = await supabase.storage
                    .from('resume-analyses')
                    .upload(newFilePath, fileData, {
                        contentType: contentType,
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`Error uploading file ${newFilePath}:`, uploadError);
                    continue;
                }

                // Get new public URL
                const { data: { publicUrl: newPublicUrl } } = supabase.storage
                    .from('resume-analyses')
                    .getPublicUrl(newFilePath);

                // Update database record
                const { error: updateError } = await supabase
                    .from('resume_uploads')
                    .update({
                        file_path: newFilePath,
                        resume_url: newPublicUrl,
                        pdf_url: newPublicUrl
                    })
                    .eq('id', upload.id);

                if (updateError) {
                    console.error(`Error updating database record for ${upload.id}:`, updateError);
                    continue;
                }

                // Delete old file (optional, can be done later)
                // const { error: deleteError } = await supabase.storage
                //   .from('resumes')
                //   .remove([oldFilePath]);

                // if (deleteError) {
                //   console.error(`Error deleting old file ${oldFilePath}:`, deleteError);
                // }

                migratedCount++;
                console.log(`Successfully migrated ${upload.id}`);

            } catch (error) {
                console.error(`Error processing upload ${upload.id}:`, error);
            }
        }

        console.log(`Migration completed. Successfully migrated ${migratedCount} files.`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
migrateResumes();
