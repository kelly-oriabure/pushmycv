/**
 * Utility functions for HTTP-level caching
 */

/**
 * Generate cache headers for different cache strategies
 */
export const cacheHeaders = {
  // Cache for 5 minutes
  short: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
  },
  
  // Cache for 1 hour
  medium: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
  },
  
  // Cache for 1 day
  long: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
  },
  
  // No cache
  none: {
    'Cache-Control': 'no-store, max-age=0',
  },
};

/**
 * Set cache headers on a response
 */
export function setCacheHeaders(res: Response, strategy: keyof typeof cacheHeaders) {
  const headers = cacheHeaders[strategy];
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(cachedAt: number, maxAge: number): boolean {
  return Date.now() - cachedAt < maxAge;
}

/**
 * Create a cache key based on parameters
 */
export function createCacheKey(prefix: string, ...params: (string | number | boolean)[]): string {
  return `${prefix}:${params.join(':')}`;
}