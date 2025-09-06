@echo off
echo ==========================================
echo   CRITICAL SERVERLESS FUNCTION FIX
echo ==========================================

cd /d "c:\Users\acer\qr mun"

echo ✅ FIXED: Critical serverless function crash
echo - Fixed module export in supabase-db.js
echo - Prevents constructor from running at import time
echo - Allows proper environment variable loading in Vercel
echo.

echo Adding and committing critical fix...
git add supabase-db.js
git commit -m "CRITICAL FIX: Prevent constructor execution at import time

- Changed module.exports from instance to class
- Fixes 500 FUNCTION_INVOCATION_FAILED error
- Allows proper env var loading in serverless environment
- Database instance now created after env vars are available"

echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   ✅ CRITICAL FIX UPLOADED SUCCESSFULLY!
    echo ==========================================
    echo.
    echo 🎯 This should resolve the 500 error completely
    echo Wait 2-3 minutes for Vercel to redeploy
    echo.
    echo Test your endpoints after deployment:
    echo - /api/health
    echo - /api/diagnostic
    echo.
) else (
    echo ❌ Upload failed - check error messages above
)

pause
