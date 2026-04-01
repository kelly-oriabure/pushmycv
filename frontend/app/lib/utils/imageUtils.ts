/**
 * Utility functions for standardized image URL handling across the application
 * Addresses the requirement to prevent URL concatenation issues and provide proper fallbacks
 */

/**
 * Normalize an image URL to handle various formats consistently
 * @param imageUrl - The image URL (can be full URL, relative path, or undefined)
 * @param fallbackUrl - The fallback URL to use if the main URL is invalid
 * @returns A properly formatted image URL
 */
export function normalizeImageUrl(imageUrl?: string | null, fallbackUrl: string = '/placeholder.svg'): string {
  // Handle null/undefined/empty strings
  if (!imageUrl || imageUrl.trim() === '') {
    return fallbackUrl;
  }

  const trimmedUrl = imageUrl.trim();

  // If it's already a full URL (http/https), return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it's a data URL, return as-is
  if (trimmedUrl.startsWith('data:')) {
    return trimmedUrl;
  }

  // If it starts with '/', it's a relative path from root - return as-is
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  // If it doesn't start with '/', assume it's a relative path and prepend '/'
  return `/${trimmedUrl}`;
}

/**
 * Get a template thumbnail image URL with proper fallback
 * @param templateImage - The template image path from template data
 * @returns A properly formatted template image URL
 */
export function getTemplateImageUrl(templateImage?: string): string {
  return normalizeImageUrl(templateImage, '/templates/default.png');
}

/**
 * Get a user avatar/photo URL with proper fallback
 * @param photoUrl - The user's photo URL
 * @param firstName - User's first name for generating initials fallback
 * @param lastName - User's last name for generating initials fallback
 * @returns A properly formatted avatar URL
 */
export function getUserAvatarUrl(photoUrl?: string | null, firstName?: string, lastName?: string): string {
  const normalizedUrl = normalizeImageUrl(photoUrl, '');
  
  // If we have a valid image URL, return it
  if (normalizedUrl && normalizedUrl !== '') {
    return normalizedUrl;
  }

  // Generate a placeholder based on initials if available
  if (firstName || lastName) {
    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    if (initials) {
      // You could return a service like ui-avatars.com or a local avatar generator
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
    }
  }

  // Final fallback
  return '/placeholder-avatar.svg';
}

/**
 * Validate if an image URL is likely to be valid
 * @param imageUrl - The image URL to validate
 * @returns Whether the URL appears to be valid
 */
export function isValidImageUrl(imageUrl?: string | null): boolean {
  if (!imageUrl || imageUrl.trim() === '') {
    return false;
  }

  const trimmedUrl = imageUrl.trim();

  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const hasImageExtension = imageExtensions.some(ext => 
    trimmedUrl.toLowerCase().includes(ext.toLowerCase())
  );

  // Check for data URLs
  const isDataUrl = trimmedUrl.startsWith('data:image/');

  // Check for valid URL structure (basic check)
  const isValidUrl = trimmedUrl.startsWith('http') || trimmedUrl.startsWith('/') || isDataUrl;

  return isValidUrl && (hasImageExtension || isDataUrl);
}

/**
 * Get optimized image URL for different screen sizes
 * @param baseUrl - The base image URL
 * @param size - The desired size (small, medium, large)
 * @returns Optimized image URL (for future integration with image optimization services)
 */
export function getOptimizedImageUrl(baseUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const normalizedUrl = normalizeImageUrl(baseUrl);
  
  // For now, return the normalized URL
  // In the future, this could integrate with services like Cloudinary or Next.js Image Optimization
  // Example: return `${normalizedUrl}?w=${sizeMap[size]}&q=75`;
  
  return normalizedUrl;
}

/**
 * Preload an image to check if it's accessible
 * @param imageUrl - The image URL to preload
 * @returns Promise that resolves to true if image loads successfully
 */
export function preloadImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    // Set a timeout to avoid hanging
    setTimeout(() => resolve(false), 5000);
    
    img.src = normalizeImageUrl(imageUrl);
  });
}