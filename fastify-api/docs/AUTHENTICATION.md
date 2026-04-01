# Supabase Authentication Integration

## Overview

The PushMyCV API now includes full Supabase authentication using JWT tokens. All protected endpoints require a valid Bearer token in the Authorization header.

## Setup

### 1. Install Dependencies

```bash
npm install
```

New packages added:
- `@fastify/jwt` - JWT token verification
- `fastify-plugin` - Plugin wrapper for Fastify

### 2. Environment Variables

Add the following to your `.env` file:

```env
SUPABASE_URL=https://hfxdqqeybszlpgtktgps.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

**Important:** Get your `SUPABASE_JWT_SECRET` from:
- Supabase Dashboard → Project Settings → API → JWT Secret

## Authentication Endpoints

### POST `/auth/signup`
Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "session": { "access_token": "...", "refresh_token": "..." }
  },
  "message": "User registered successfully. Please check your email for verification."
}
```

### POST `/auth/signin`
Sign in with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "..." },
    "session": { "access_token": "...", "refresh_token": "..." },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET `/auth/me`
Get current authenticated user (requires authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "authenticated"
  }
}
```

### POST `/auth/signout`
Sign out the current user (requires authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### POST `/auth/reset-password`
Request a password reset email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

### POST `/auth/refresh`
Refresh an expired access token

**Request:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": { "access_token": "...", "refresh_token": "..." },
    "access_token": "new_access_token"
  }
}
```

## Protected Endpoints

All the following endpoints now require authentication:

### Profiles
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:user_id` - Get specific profile
- `POST /api/profiles` - Create profile
- `PUT /api/profiles/:user_id` - Update profile
- `DELETE /api/profiles/:user_id` - Delete profile

### Resumes
- `GET /api/resumes?user_id=uuid` - List user's resumes
- `GET /api/resumes/:id` - Get specific resume
- `POST /api/resumes` - Create resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume

### Work Experiences
- `GET /api/experiences?user_id=uuid` - List work experiences
- `POST /api/experiences` - Create work experience
- `PUT /api/experiences/:id` - Update experience
- `DELETE /api/experiences/:id` - Delete experience

### Jobs
- `GET /api/jobs` - List jobs (optional auth)
- `GET /api/jobs/:id` - Get specific job (optional auth)
- `POST /api/jobs` - Create job (requires auth)
- `PUT /api/jobs/:id` - Update job (requires auth)
- `DELETE /api/jobs/:id` - Delete job (requires auth)

### Applications
- `GET /api/applications?user_id=uuid` - List applications
- `GET /api/applications/:id` - Get application
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `GET /api/applications/stats?user_id=uuid` - Get statistics

## Usage Examples

### 1. Sign Up
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123",
    "full_name": "John Doe"
  }'
```

### 2. Sign In
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Save the `access_token` from the response!**

### 3. Access Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/profiles \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Create a Profile
```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "email": "john@example.com",
    "full_name": "John Doe",
    "location": "San Francisco, CA"
  }'
```

## Authentication Flow

```
1. User signs up → Receives access_token and refresh_token
2. User stores tokens securely (localStorage/sessionStorage)
3. User makes API requests with: Authorization: Bearer <access_token>
4. When access_token expires → Use refresh_token to get new access_token
5. User signs out → Tokens are invalidated
```

## Token Expiration

- **Access Token:** Expires in 1 hour (default Supabase setting)
- **Refresh Token:** Expires in 30 days (default Supabase setting)

When the access token expires, use the `/auth/refresh` endpoint with the refresh token to get a new access token.

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Missing authorization header"
}
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Security Best Practices

1. **Never expose tokens in URLs** - Always use headers
2. **Store tokens securely** - Use httpOnly cookies or secure storage
3. **Implement token refresh** - Refresh before expiration
4. **Use HTTPS in production** - Encrypt all traffic
5. **Implement rate limiting** - Prevent brute force attacks
6. **Validate user input** - Sanitize all inputs
7. **Enable RLS in Supabase** - Row-level security policies

## Swagger UI

Visit `http://localhost:3000/docs` to test authentication in Swagger:

1. Click the **Authorize** button (lock icon)
2. Enter: `Bearer <your_access_token>`
3. Click **Authorize**
4. Now you can test protected endpoints

## Row-Level Security (RLS)

Supabase RLS policies are already configured in the database schema. They ensure:

- Users can only access their own data
- Profiles are linked to authenticated users
- Resumes, applications, and experiences are user-specific
- Job listings are publicly readable but require auth to create/modify

## Testing Authentication

### Using Swagger UI
1. Start the server: `npm run dev`
2. Open http://localhost:3000/docs
3. Use `/auth/signup` to create a user
4. Use `/auth/signin` to get a token
5. Click **Authorize** and paste the token
6. Test protected endpoints

### Using Postman
1. Create a new request
2. Set Authorization → Type: Bearer Token
3. Paste your access_token
4. Send requests to protected endpoints

### Using curl
```bash
# Store token in variable
TOKEN="your_access_token_here"

# Make authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/profiles
```

## Troubleshooting

### "Missing authorization header"
- Ensure you're sending the `Authorization` header
- Format: `Authorization: Bearer <token>`

### "Invalid or expired token"
- Token may have expired (1 hour default)
- Use `/auth/refresh` to get a new token
- Verify `SUPABASE_JWT_SECRET` is correct

### "JWT verification failed"
- Check that `SUPABASE_JWT_SECRET` matches your Supabase project
- Ensure the token is from the correct Supabase project

### TypeScript Errors
The TypeScript errors about `fastify.authenticate` will resolve after running:
```bash
npm install
```

These are expected during development and don't affect runtime functionality.

## Next Steps

1. **Install dependencies:** `npm install`
2. **Update .env:** Add `SUPABASE_JWT_SECRET`
3. **Restart server:** `npm run dev`
4. **Test authentication:** Use Swagger UI at `/docs`
5. **Implement frontend:** Use Supabase client library

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Fastify JWT Plugin](https://github.com/fastify/fastify-jwt)
- [JWT.io](https://jwt.io/) - Decode and inspect tokens
