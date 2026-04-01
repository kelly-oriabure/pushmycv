#!/bin/bash

# Deploy Supabase Edge Functions
# Make sure you have Supabase CLI installed and are logged in

echo "Deploying Supabase Edge Functions..."

# Deploy the resume-analysis function
echo "Deploying resume-analysis function..."
supabase functions deploy resume-analysis

if [ $? -eq 0 ]; then
    echo "✅ resume-analysis function deployed successfully"
else
    echo "❌ Failed to deploy resume-analysis function"
    exit 1
fi

# Deploy the webhook-test function
echo "Deploying webhook-test function..."
supabase functions deploy webhook-test

if [ $? -eq 0 ]; then
    echo "✅ webhook-test function deployed successfully"
else
    echo "❌ Failed to deploy webhook-test function"
    exit 1
fi

echo "🎉 All functions deployed successfully!"
echo ""
echo "Function URLs:"
echo "resume-analysis: https://your-project-ref.supabase.co/functions/v1/resume-analysis"
echo "webhook-test: https://your-project-ref.supabase.co/functions/v1/webhook-test"
echo ""
echo "Don't forget to:"
echo "1. Set up environment variables in Supabase dashboard"
echo "2. Configure RLS policies if needed"
echo "3. Test the functions with your application"