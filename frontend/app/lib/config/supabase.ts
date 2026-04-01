/**
 * Supabase Configuration
 * 
 * Centralized configuration for Supabase clients with proper environment variable handling
 */

import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}

/**
 * Validates and returns Supabase configuration from environment variables
 */
export function getSupabaseConfig(): SupabaseConfig {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
    }

    if (!anonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
    }

    return {
        url,
        anonKey,
        serviceRoleKey
    };
}

/**
 * Creates a Supabase client with validated configuration
 */
export function createSupabaseClient(config?: Partial<SupabaseConfig>) {
    const supabaseConfig = getSupabaseConfig();

    const finalConfig = { ...supabaseConfig, ...config };

    return createClient(finalConfig.url, finalConfig.anonKey);
}

/**
 * Creates a Supabase admin client with service role key
 */
export function createSupabaseAdminClient() {
    const config = getSupabaseConfig();

    if (!config.serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations');
    }

    return createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Environment validation
 */
export function validateSupabaseEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    }

    // Service role key is optional for some operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY is not set - admin operations will not be available');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
