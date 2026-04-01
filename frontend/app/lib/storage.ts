import "server-only";
import { supabaseAdmin as supabase } from '@/integrations/supabase/admin';

const TEMPLATE_THUMBNAILS_BUCKET = 'template-thumbnails';
const AVATARS_BUCKET = 'avatars';

/**
 * Get the public URL for a template thumbnail
 * @param path The path to the thumbnail in the storage bucket
 * @returns Full public URL to the thumbnail
 */
export const getTemplateThumbnailUrl = (path: string): string => {
    if (!path) return '';

    // If it's already a full URL, return as is
    if (path.startsWith('http')) {
        return path;
    }

    // Otherwise, construct the URL
    const { data } = supabase.storage
        .from(TEMPLATE_THUMBNAILS_BUCKET)
        .getPublicUrl(path);

    return data.publicUrl;
};

/**
 * Upload a template thumbnail to storage
 * @param file The file to upload
 * @param fileName The name to give the file in storage
 * @returns The path to the uploaded file
 */
export const uploadTemplateThumbnail = async (file: File, fileName: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${fileName}.${fileExt}`;

    const { error } = await supabase.storage
        .from(TEMPLATE_THUMBNAILS_BUCKET)
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading template thumbnail:', error);
        throw error;
    }

    return filePath;
};

/**
 * Delete a template thumbnail from storage
 * @param path The path to the file in storage
 */
export const deleteTemplateThumbnail = async (path: string): Promise<void> => {
    if (!path) return;

    const { error } = await supabase.storage
        .from(TEMPLATE_THUMBNAILS_BUCKET)
        .remove([path]);

    if (error) {
        console.error('Error deleting template thumbnail:', error);
        throw error;
    }
};

/**
 * Upload a user avatar image to storage
 * @param file The file to upload
 * @param userIdOrResumeId The user or resume id to namespace the file
 * @returns The public URL to the uploaded avatar
 */
export const uploadAvatarImage = async (file: File, userIdOrResumeId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userIdOrResumeId}/${Date.now()}.${fileExt}`;

    const response = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, file, { upsert: true });

    if (response.error) {
        console.error('Error uploading avatar image:', response.error, response);
        if (Object.keys(response.error).length === 0) {
            throw new Error('Unknown error uploading avatar image. Check file size, type, authentication, and bucket permissions.');
        }
        throw response.error;
    }

    // Get the public URL
    const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};
