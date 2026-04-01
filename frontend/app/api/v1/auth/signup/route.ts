import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/config/supabase';
import { ApiValidator, requestSchemas } from '@/lib/validation/apiValidation';
import { StandardErrorHandler, StandardSuccessHandler, ErrorCode } from '@/lib/errors/standardErrors';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate request body using standardized validation
    const validation = await ApiValidator.validateBody(request, requestSchemas.signup);
    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { email, password, firstName, lastName } = validation.data;

    // Create Supabase client using unified configuration
    const supabase = createSupabaseClient();

    // Register user
    console.log('Attempting Supabase signup with:', { email, password: '***', firstName, lastName });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    console.log('Supabase signup result:', { data, error });

    if (error) {
      console.error('Supabase signup error:', error);
      return StandardErrorHandler.createErrorResponse(
        ErrorCode.INVALID_CREDENTIALS,
        { message: error.message },
        'Registration failed'
      );
    }

    if (!data.user) {
      return StandardErrorHandler.createErrorResponse(
        ErrorCode.INVALID_CREDENTIALS,
        undefined,
        'Registration failed'
      );
    }

    // Check if email confirmation is required
    if (!data.session) {
      return StandardSuccessHandler.createSuccessResponse({
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at
        },
        requires_confirmation: true
      }, 'Registration successful. Please check your email to confirm your account.');
    }

    // Return success response with JWT token (if auto-confirmed)
    return StandardSuccessHandler.createSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      }
    }, 'Registration successful');

  } catch (error) {
    console.error('Signup error:', error);
    return StandardErrorHandler.createInternalError(
      error instanceof Error ? error.message : 'Unknown error',
      'Registration failed'
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}