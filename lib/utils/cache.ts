/**
 * Simple caching utilities using localStorage
 */

const CACHE_PREFIX = "navigator_cache_";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
    data: T;
    timestamp: number;
}

/**
 * Get cached data if it exists and is not expired
 */
export function getCachedData<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!cached) return null;

        const parsed: CachedData<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is expired
        if (now - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }

        return parsed.data;
    } catch (error) {
        console.error("Error reading cache:", error);
        return null;
    }
}

/**
 * Set cached data with timestamp
 */
export function setCachedData<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;

    try {
        const cached: CachedData<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
    } catch (error) {
        console.error("Error writing cache:", error);
    }
}

/**
 * Invalidate cached data for a key
 */
export function invalidateCache(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
    if (typeof window === "undefined") return;
    
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
}
