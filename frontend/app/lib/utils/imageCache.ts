import React from 'react';

/**
 * Image caching utilities for template thumbnails and other assets
 */

class ImageCache {
  private cache: Map<string, string> = new Map();
  private loading: Set<string> = new Set();
  private callbacks: Map<string, Array<(dataUrl: string) => void>> = new Map();

  /**
   * Preload and cache an image
   */
  async preloadImage(src: string): Promise<string> {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // If already loading, wait for completion
    if (this.loading.has(src)) {
      return new Promise((resolve) => {
        const callbacks = this.callbacks.get(src) || [];
        callbacks.push(resolve);
        this.callbacks.set(src, callbacks);
      });
    }

    // Mark as loading
    this.loading.add(src);
    
    try {
      const dataUrl = await this.convertToDataUrl(src);
      this.cache.set(src, dataUrl);
      
      // Notify all waiting callbacks
      const callbacks = this.callbacks.get(src) || [];
      callbacks.forEach(callback => callback(dataUrl));
      this.callbacks.delete(src);
      
      return dataUrl;
    } finally {
      this.loading.delete(src);
    }
  }

  /**
   * Convert image URL to data URL
   */
  private convertToDataUrl(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * Get cached image
   */
  getCachedImage(src: string): string | null {
    return this.cache.get(src) || null;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.loading.clear();
    this.callbacks.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const imageCache = new ImageCache();

/**
 * Hook for using cached images in components
 */
export function useCachedImage(src: string): { 
  dataUrl: string | null; 
  loading: boolean;
  error: string | null;
} {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    // Check if already cached
    const cached = imageCache.getCachedImage(src);
    if (cached) {
      setDataUrl(cached);
      setLoading(false);
      return;
    }

    // Load image
    imageCache.preloadImage(src)
      .then(setDataUrl)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [src]);

  return { dataUrl, loading, error };
}