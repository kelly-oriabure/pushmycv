# OTP Authentication Flow

## Overview

PushMyCV now supports a secure **Email OTP (One-Time Password) authentication flow** for user registration. This provides a passwordless initial verification step before completing account creation.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    OTP Authentication Flow                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Collect User Information & Request OTP
   ↓
   User provides: email, full_name, phone, location
   ↓
   System generates 6-digit OTP
   ↓
   OTP sent to user's email (expires in 10 minutes)

Step 2: Verify OTP
   ↓
   User enters OTP code
   ↓
   System validates OTP (max 5 attempts)
   ↓
   Email verified ✓

Step 3: Complete Registration
   ↓
   User sets password
   ↓
   Account created with Supabase Auth
   ↓
   Profile created in database
   ↓
   Welcome email sent
   ↓
   User receives access token
```

## API Endpoints

### 1. Request OTP
**POST** `/auth/otp/request-otp`

Collect user information and send OTP to email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email. Please check your inbox.",
  "expires_in": "10 minutes"
}
```

**Validation:**
- Email must be valid format
- Email must not already be registered
- Full name is optional but recommended
- Phone and location are optional

---

### 2. Verify OTP
**POST** `/auth/otp/verify-otp`

Verify the OTP code sent to email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now complete your registration.",
  "verified": true
}
```

**Response (Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP. 3 attempts remaining.",
  "verified": false
}
```

**Validation:**
- OTP must be exactly 6 digits
- Maximum 5 verification attempts
- OTP expires after 10 minutes
- OTP can only be used once

---

### 3. Complete Registration
**POST** `/auth/otp/complete-registration`

Complete account creation after OTP verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully!",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "user_metadata": {
        "full_name": "John Doe",
        "phone": "+1234567890",
        "location": "San Francisco, CA"
      }
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "...",
      "expires_in": 3600
    },
    "access_token": "eyJhbGc..."
  }
}
```

**Validation:**
- Email must have verified OTP
- Password must be at least 8 characters
- Creates Supabase Auth user
- Creates profile in database
- Sends welcome email

---

### 4. Resend OTP
**POST** `/auth/otp/resend-otp`

Resend OTP if the previous one expired or was lost.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully. Please check your email."
}
```

---

## Usage Examples

### Complete Registration Flow

#### Step 1: Request OTP
```bash
curl -X POST http://localhost:3000/auth/otp/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "location": "San Francisco, CA"
  }'
```

**Check your email for the 6-digit OTP code**

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:3000/auth/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

#### Step 3: Complete Registration
```bash
curl -X POST http://localhost:3000/auth/otp/complete-registration \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Save the `access_token` from the response!**

#### Step 4: Use Access Token
```bash
curl -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Email Templates

### OTP Email
```
Subject: Your PushMyCV Verification Code

Hello John Doe,

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
PushMyCV Team
```

### Welcome Email
```
Subject: Welcome to PushMyCV!

Hello John Doe,

Welcome to PushMyCV! Your account has been successfully created.

You can now:
✅ Create and manage professional resumes
✅ Track job applications
✅ Generate tailored cover letters
✅ Store work experience and skills
✅ Apply to jobs with one click

Get Started: http://localhost:3000

Best regards,
PushMyCV Team
```

---

## Security Features

### OTP Security
- ✅ 6-digit random OTP
- ✅ 10-minute expiration
- ✅ Maximum 5 verification attempts
- ✅ One-time use only
- ✅ Secure storage in database
- ✅ Automatic cleanup of expired OTPs

### Email Verification
- ✅ Prevents fake email registrations
- ✅ Ensures user owns the email
- ✅ Duplicate email prevention
- ✅ Case-insensitive email handling

### Password Security
- ✅ Minimum 8 characters
- ✅ Handled by Supabase Auth
- ✅ Bcrypt hashing
- ✅ Secure password reset flow

---

## Database Schema

### OTP Verifications Table
```sql
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    otp VARCHAR(6) NOT NULL,
    user_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_otp_email` - Fast email lookups
- `idx_otp_expires` - Efficient cleanup queries

**RLS Policies:**
- Service role only (for security)

---

## Error Handling

### Common Errors

#### Email Already Registered
```json
{
  "success": false,
  "message": "An account with this email already exists. Please sign in instead."
}
```

#### OTP Expired
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one."
}
```

#### Max Attempts Exceeded
```json
{
  "success": false,
  "message": "Maximum verification attempts exceeded. Please request a new OTP."
}
```

#### Email Not Verified
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email with OTP first."
}
```

---

## Configuration

### Environment Variables

```env
# Email Configuration (for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@pushmycv.com

# App URL
APP_URL=http://localhost:3000
```

### OTP Settings (in code)

```typescript
const OTP_EXPIRY_MINUTES = 10;      // OTP validity period
const MAX_OTP_ATTEMPTS = 5;         // Maximum verification attempts
const OTP_LENGTH = 6;               // OTP code length
```

---

## Cron Jobs

### Cleanup Expired OTPs
- **Schedule:** Every 30 minutes
- **Task:** Delete expired OTP records
- **Purpose:** Keep database clean and secure

```typescript
{
  name: 'Cleanup Expired OTPs',
  schedule: '*/30 * * * *',
  task: cleanupExpiredOTPs
}
```

---

## Testing in Swagger UI

1. **Start the server:** `npm run dev`
2. **Open Swagger:** http://localhost:3000/docs
3. **Find OTP Auth section** in the API documentation
4. **Test the flow:**
   - POST `/auth/otp/request-otp`
   - Check console/logs for OTP (development mode)
   - POST `/auth/otp/verify-otp`
   - POST `/auth/otp/complete-registration`
   - Use the access token with **Authorize** button

---

## Development Mode

In development (`NODE_ENV=development`), OTP emails are logged to console instead of being sent:

```
📧 EMAIL (Development Mode)
{
  to: 'john@example.com',
  subject: 'Your PushMyCV Verification Code',
  text: 'Your verification code is: 123456...'
}
```

---

## Production Setup

### Email Service Integration

For production, integrate a real email service (e.g., SendGrid, AWS SES, Mailgun):

```typescript
// src/utils/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(options: EmailOptions) {
    await sgMail.send({
        to: options.to,
        from: process.env.SMTP_FROM,
        subject: options.subject,
        text: options.text,
        html: options.html
    });
}
```

---

## Advantages of OTP Flow

1. **Better Security** - Email ownership verification
2. **User-Friendly** - No complex password requirements initially
3. **Reduced Spam** - Prevents fake registrations
4. **Better UX** - Simpler initial signup
5. **Email Validation** - Ensures valid email addresses
6. **Flexible** - Can add phone OTP later

---

## Migration from Password-Based Auth

Both authentication methods coexist:

- **OTP Flow:** `/auth/otp/*` endpoints
- **Password Flow:** `/auth/signup`, `/auth/signin` endpoints

Users can choose their preferred method!

---

## Next Steps

1. **Create OTP table:** Run `database/otp_table.sql` in Supabase
2. **Configure email:** Set up SMTP or email service
3. **Test flow:** Use Swagger UI
4. **Customize templates:** Update email templates
5. **Add phone OTP:** Extend for SMS verification

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify database table exists
- Ensure email service is configured
- Check OTP expiration and attempts

Happy coding! 🚀
