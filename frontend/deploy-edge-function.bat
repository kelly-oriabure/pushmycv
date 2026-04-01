@echo off
echo ========================================
echo Deploying resume-analysis Edge Function
echo ========================================
echo.
echo Project: embugkjoeyfukdotmgyg (jobeazydb)
echo Function: resume-analysis
echo.

REM Deploy the edge function
supabase functions deploy resume-analysis --project-ref embugkjoeyfukdotmgyg

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Deployment Successful!
    echo ========================================
    echo.
    echo The edge function has been deployed with:
    echo - Corrected n8n webhook URL
    echo - 30-second timeout mechanism
    echo - Proper error handling
    echo.
    echo Next steps:
    echo 1. Test with a resume upload
    echo 2. Check n8n workflow execution
    echo 3. Verify scores in database
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Deployment Failed
    echo ========================================
    echo.
    echo Please check:
    echo 1. Supabase CLI is installed: supabase --version
    echo 2. You're logged in: supabase login
    echo 3. Project is linked: supabase link --project-ref embugkjoeyfukdotmgyg
    echo.
)

pause
