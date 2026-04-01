import { logger } from './logger.js';

export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        onRetry
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === maxAttempts) {
                logger.error('Max retry attempts reached', lastError, { attempts: maxAttempts });
                throw lastError;
            }

            const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
            logger.warn('Retry attempt failed, retrying...', {
                attempt,
                maxAttempts,
                delayMs: delay,
                error: lastError.message
            });

            if (onRetry) {
                onRetry(attempt, lastError);
            }

            await sleep(delay);
        }
    }

    throw lastError!;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
