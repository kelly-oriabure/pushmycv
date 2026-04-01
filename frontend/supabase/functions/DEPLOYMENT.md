# Supabase Edge Functions Deployment Guide

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. **Deno**: Install Deno runtime (required for edge functions)
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

3. **Supabase Project**: Make sure you have a Supabase project set up

## Setup

1. **Login to Supabase**:
   ```bash
   supabase login
   ```

2. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Start local development** (optional):
   ```bash
   supabase start
   ```

## Deployment

### Deploy All Functions
```bash
# Make the deployment script executable (Unix/macOS)
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Deploy Individual Function
```bash
# Deploy resume-analysis function
supabase functions deploy resume-analysis
```

## Environment Variables

Set these in your Supabase dashboard under Settings > Edge Functions:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Testing

### Local Testing
```bash
# Start local Supabase (if not already running)
supabase start

# Test the function locally
cd supabase/functions/resume-analysis
deno run --allow-net test.ts
```

### Production Testing
Update the `test.ts` file with your production URL and test:
```typescript
const functionUrl = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/resume-analysis'
```

## Function URLs

- **Local**: `http://localhost:54329/functions/v1/resume-analysis`
- **Production**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/resume-analysis`

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure CORS headers are properly set in the function
2. **Authentication**: Ensure you're passing the correct Authorization header
3. **Environment Variables**: Verify all required env vars are set in Supabase dashboard
4. **Deno Permissions**: Make sure Deno has the necessary permissions (--allow-net, --allow-env)

### Logs

View function logs:
```bash
# Local logs
supabase functions logs resume-analysis

# Production logs (in Supabase dashboard)
# Go to Edge Functions > resume-analysis > Logs
```

## Security

- Never commit sensitive keys to version control
- Use environment variables for all secrets
- Implement proper authentication in your functions
- Validate all input data

## Next Steps

1. Set up monitoring and alerting
2. Implement rate limiting if needed
3. Add comprehensive error handling
4. Set up CI/CD pipeline for automatic deployments