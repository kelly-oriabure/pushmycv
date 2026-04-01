import { z } from 'zod';
import { NextRequest } from 'next/server';

// Standard error response format
export interface StandardErrorResponse {
    error: string;
    details?: any;
    code?: string;
    timestamp: string;
}

// Standard success response format
export interface StandardSuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
}

// File validation schemas
export const fileValidationSchema = z.object({
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
    allowedTypes: z.array(z.string()).default(['application/pdf', 'image/jpeg', 'image/png']),
    required: z.boolean().default(true)
});

// Common validation schemas
export const commonSchemas = {
    // UUID validation
    uuid: z.string().uuid('Invalid UUID format'),

    // Email validation
    email: z.string().email('Invalid email format'),

    // Password validation
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    // Name validation
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),

    // Phone validation
    phone: z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
        .optional(),

    // URL validation
    url: z.string().url('Invalid URL format'),

    // File size validation (in bytes)
    fileSize: z.number()
        .min(1, 'File size must be greater than 0')
        .max(50 * 1024 * 1024, 'File size must be less than 50MB'),

    // File type validation
    fileType: z.string()
        .refine((type) =>
            ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'].includes(type),
            'Invalid file type'
        )
};

// Request validation schemas
export const requestSchemas = {
    // Login request
    login: z.object({
        email: commonSchemas.email,
        password: z.string().min(6, 'Password must be at least 6 characters')
    }),

    // Signup request
    signup: z.object({
        email: commonSchemas.email,
        password: commonSchemas.password,
        firstName: commonSchemas.name.optional(),
        lastName: commonSchemas.name.optional()
    }),

    // Resume analysis request
    resumeAnalysis: z.object({
        resumeUploadId: commonSchemas.uuid,
        jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title must be less than 200 characters').optional()
    }),

    // File upload request
    fileUpload: z.object({
        file: z.object({
            name: z.string().min(1, 'File name is required'),
            size: commonSchemas.fileSize,
            type: commonSchemas.fileType
        }),
        metadata: z.record(z.any()).optional()
    }),

    // Resume data request
    resumeData: z.object({
        personalDetails: z.object({
            firstName: commonSchemas.name,
            lastName: commonSchemas.name,
            email: commonSchemas.email,
            phone: commonSchemas.phone,
            address: z.string().max(500, 'Address must be less than 500 characters').optional(),
            linkedin: z.string().url('Invalid LinkedIn URL').optional(),
            website: z.string().url('Invalid website URL').optional()
        }).optional(),

        experience: z.array(z.object({
            company: z.string().min(1, 'Company name is required').max(200, 'Company name must be less than 200 characters'),
            position: z.string().min(1, 'Position is required').max(200, 'Position must be less than 200 characters'),
            startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
            endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format').optional(),
            description: z.string().max(2000, 'Description must be less than 2000 characters').optional()
        })).optional(),

        education: z.array(z.object({
            institution: z.string().min(1, 'Institution name is required').max(200, 'Institution name must be less than 200 characters'),
            degree: z.string().min(1, 'Degree is required').max(200, 'Degree must be less than 200 characters'),
            field: z.string().max(200, 'Field must be less than 200 characters').optional(),
            startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
            endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format').optional(),
            gpa: z.string().max(10, 'GPA must be less than 10 characters').optional()
        })).optional(),

        skills: z.array(z.string().min(1, 'Skill cannot be empty').max(100, 'Skill must be less than 100 characters')).optional()
    })
};

// Validation helper functions
export class ApiValidator {
    /**
     * Validate request body against a schema
     */
    static async validateBody<T>(
        request: NextRequest,
        schema: z.ZodSchema<T>
    ): Promise<{ success: true; data: T } | { success: false; error: StandardErrorResponse }> {
        try {
            // Check content type
            const contentType = request.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return {
                    success: false,
                    error: {
                        error: 'Invalid content type',
                        details: 'Content-Type must be application/json',
                        code: 'INVALID_CONTENT_TYPE',
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Parse JSON body
            const body = await request.json();

            // Validate against schema
            const result = schema.safeParse(body);

            if (!result.success) {
                return {
                    success: false,
                    error: {
                        error: 'Validation failed',
                        details: result.error.errors,
                        code: 'VALIDATION_ERROR',
                        timestamp: new Date().toISOString()
                    }
                };
            }

            return {
                success: true,
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    error: 'Invalid JSON body',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'INVALID_JSON',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Validate file upload
     */
    static validateFile(
        file: File,
        options: {
            maxSize?: number;
            allowedTypes?: string[];
            required?: boolean;
        } = {}
    ): { success: true } | { success: false; error: StandardErrorResponse } {
        const { maxSize = 10 * 1024 * 1024, allowedTypes = ['application/pdf'], required = true } = options;

        if (!file && required) {
            return {
                success: false,
                error: {
                    error: 'File is required',
                    code: 'FILE_REQUIRED',
                    timestamp: new Date().toISOString()
                }
            };
        }

        if (file) {
            // Check file size
            if (file.size > maxSize) {
                return {
                    success: false,
                    error: {
                        error: 'File too large',
                        details: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
                        code: 'FILE_TOO_LARGE',
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Check file type
            if (!allowedTypes.includes(file.type)) {
                return {
                    success: false,
                    error: {
                        error: 'Invalid file type',
                        details: `Allowed types: ${allowedTypes.join(', ')}`,
                        code: 'INVALID_FILE_TYPE',
                        timestamp: new Date().toISOString()
                    }
                };
            }
        }

        return { success: true };
    }

    /**
     * Validate query parameters
     */
    static validateQuery<T>(
        searchParams: URLSearchParams,
        schema: z.ZodSchema<T>
    ): { success: true; data: T } | { success: false; error: StandardErrorResponse } {
        try {
            const params = Object.fromEntries(searchParams.entries());
            const result = schema.safeParse(params);

            if (!result.success) {
                return {
                    success: false,
                    error: {
                        error: 'Invalid query parameters',
                        details: result.error.errors,
                        code: 'INVALID_QUERY',
                        timestamp: new Date().toISOString()
                    }
                };
            }

            return {
                success: true,
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    error: 'Query validation failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    code: 'QUERY_VALIDATION_ERROR',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Validate headers
     */
    static validateHeaders(
        request: NextRequest,
        requiredHeaders: string[]
    ): { success: true } | { success: false; error: StandardErrorResponse } {
        const missingHeaders = requiredHeaders.filter(header => !request.headers.get(header));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                error: {
                    error: 'Missing required headers',
                    details: missingHeaders,
                    code: 'MISSING_HEADERS',
                    timestamp: new Date().toISOString()
                }
            };
        }

        return { success: true };
    }
}

// SQL injection prevention helpers
export class SqlInjectionPrevention {
    /**
     * Sanitize string input to prevent SQL injection
     */
    static sanitizeString(input: string): string {
        return input
            .replace(/['"\\]/g, '') // Remove quotes and backslashes
            .replace(/[;-]/g, '') // Remove SQL comment markers (semicolon and dash)
            .replace(/union|select|insert|update|delete|drop|create|alter/gi, '') // Remove SQL keywords
            .trim();
    }

    /**
     * Validate UUID format to prevent injection
     */
    static validateUuid(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Validate numeric input
     */
    static validateNumber(input: string | number): boolean {
        const num = typeof input === 'string' ? parseFloat(input) : input;
        return !isNaN(num) && isFinite(num);
    }
}
