import { NextResponse } from 'next/server';
import type { StandardErrorResponse, StandardSuccessResponse } from '@/lib/validation/apiValidation';

// Standard error codes
export enum ErrorCode {
    // Authentication errors
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',

    // Validation errors
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_CONTENT_TYPE = 'INVALID_CONTENT_TYPE',
    INVALID_JSON = 'INVALID_JSON',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',

    // File errors
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    FILE_REQUIRED = 'FILE_REQUIRED',
    FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

    // Database errors
    DATABASE_ERROR = 'DATABASE_ERROR',
    RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
    DUPLICATE_RECORD = 'DUPLICATE_RECORD',
    CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

    // Rate limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // External service errors
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

    // General errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    BAD_REQUEST = 'BAD_REQUEST',
    CONFLICT = 'CONFLICT'
}

// Standard error messages
export const ErrorMessages = {
    [ErrorCode.UNAUTHORIZED]: 'Authentication required',
    [ErrorCode.FORBIDDEN]: 'Access denied',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired',

    [ErrorCode.VALIDATION_ERROR]: 'Request validation failed',
    [ErrorCode.INVALID_CONTENT_TYPE]: 'Invalid content type',
    [ErrorCode.INVALID_JSON]: 'Invalid JSON format',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ErrorCode.INVALID_FORMAT]: 'Invalid data format',

    [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
    [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
    [ErrorCode.FILE_REQUIRED]: 'File is required',
    [ErrorCode.FILE_UPLOAD_FAILED]: 'File upload failed',

    [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
    [ErrorCode.RECORD_NOT_FOUND]: 'Record not found',
    [ErrorCode.DUPLICATE_RECORD]: 'Record already exists',
    [ErrorCode.CONSTRAINT_VIOLATION]: 'Database constraint violation',

    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',

    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',

    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCode.NOT_FOUND]: 'Resource not found',
    [ErrorCode.BAD_REQUEST]: 'Bad request',
    [ErrorCode.CONFLICT]: 'Resource conflict'
};

// HTTP status codes mapping
export const HttpStatusCodes = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,

    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_CONTENT_TYPE]: 400,
    [ErrorCode.INVALID_JSON]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,

    [ErrorCode.FILE_TOO_LARGE]: 413,
    [ErrorCode.INVALID_FILE_TYPE]: 400,
    [ErrorCode.FILE_REQUIRED]: 400,
    [ErrorCode.FILE_UPLOAD_FAILED]: 500,

    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.RECORD_NOT_FOUND]: 404,
    [ErrorCode.DUPLICATE_RECORD]: 409,
    [ErrorCode.CONSTRAINT_VIOLATION]: 400,

    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,

    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.CONFLICT]: 409
};

// Standard error response creator
export class StandardErrorHandler {
    /**
     * Create a standard error response
     */
    static createErrorResponse(
        code: ErrorCode,
        details?: any,
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        const message = customMessage || ErrorMessages[code];
        const statusCode = HttpStatusCodes[code];

        const errorResponse: StandardErrorResponse = {
            error: message,
            code,
            timestamp: new Date().toISOString()
        };

        if (details) {
            errorResponse.details = details;
        }

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    /**
     * Create a validation error response
     */
    static createValidationError(
        validationErrors: any[],
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        return this.createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            validationErrors,
            customMessage || 'Request validation failed'
        );
    }

    /**
     * Create an authentication error response
     */
    static createAuthError(
        code: ErrorCode = ErrorCode.UNAUTHORIZED,
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        return this.createErrorResponse(code, undefined, customMessage);
    }

    /**
     * Create a file error response
     */
    static createFileError(
        code: ErrorCode,
        details?: any,
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        return this.createErrorResponse(code, details, customMessage);
    }

    /**
     * Create a database error response
     */
    static createDatabaseError(
        code: ErrorCode = ErrorCode.DATABASE_ERROR,
        details?: any,
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        return this.createErrorResponse(code, details, customMessage);
    }

    /**
     * Create a rate limit error response
     */
    static createRateLimitError(
        retryAfter?: number
    ): NextResponse<StandardErrorResponse> {
        const response = this.createErrorResponse(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            retryAfter ? { retryAfter } : undefined
        );

        if (retryAfter) {
            response.headers.set('Retry-After', retryAfter.toString());
        }

        return response;
    }

    /**
     * Create an internal server error response
     */
    static createInternalError(
        details?: any,
        customMessage?: string
    ): NextResponse<StandardErrorResponse> {
        return this.createErrorResponse(
            ErrorCode.INTERNAL_SERVER_ERROR,
            details,
            customMessage || 'An unexpected error occurred'
        );
    }
}

// Standard success response creator
export class StandardSuccessHandler {
    /**
     * Create a standard success response
     */
    static createSuccessResponse<T>(
        data: T,
        message?: string,
        statusCode: number = 200
    ): NextResponse<StandardSuccessResponse<T>> {
        const successResponse: StandardSuccessResponse<T> = {
            success: true,
            data,
            timestamp: new Date().toISOString()
        };

        if (message) {
            successResponse.message = message;
        }

        return NextResponse.json(successResponse, { status: statusCode });
    }

    /**
     * Create a created response (201)
     */
    static createCreatedResponse<T>(
        data: T,
        message?: string
    ): NextResponse<StandardSuccessResponse<T>> {
        return this.createSuccessResponse(data, message, 201);
    }

    /**
     * Create a no content response (204)
     */
    static createNoContentResponse(): NextResponse {
        return new NextResponse(null, { status: 204 });
    }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
    /**
     * Handle async operation errors
     */
    async handleAsync<T>(
        operation: () => Promise<T>,
        errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
    ): Promise<T | NextResponse<StandardErrorResponse>> {
        try {
            return await operation();
        } catch (error) {
            console.error('Async operation error:', error);
            return StandardErrorHandler.createInternalError(
                error instanceof Error ? error.message : 'Unknown error',
                'Operation failed'
            );
        }
    },

    /**
     * Handle database operation errors
     */
    handleDatabaseError(error: any): NextResponse<StandardErrorResponse> {
        console.error('Database error:', error);

        // Check for specific database error types
        if (error.code === '23505') { // Unique constraint violation
            return StandardErrorHandler.createDatabaseError(
                ErrorCode.DUPLICATE_RECORD,
                'Record already exists'
            );
        }

        if (error.code === '23503') { // Foreign key constraint violation
            return StandardErrorHandler.createDatabaseError(
                ErrorCode.CONSTRAINT_VIOLATION,
                'Referenced record not found'
            );
        }

        if (error.code === '23502') { // Not null constraint violation
            return StandardErrorHandler.createDatabaseError(
                ErrorCode.CONSTRAINT_VIOLATION,
                'Required field is missing'
            );
        }

        // Generic database error
        return StandardErrorHandler.createDatabaseError(
            ErrorCode.DATABASE_ERROR,
            error.message
        );
    },

    /**
     * Handle external service errors
     */
    handleExternalServiceError(error: any, serviceName: string): NextResponse<StandardErrorResponse> {
        console.error(`External service error (${serviceName}):`, error);

        return StandardErrorHandler.createErrorResponse(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            { service: serviceName, message: error.message },
            `${serviceName} service error`
        );
    }
};
