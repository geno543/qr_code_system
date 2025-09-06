@echo off
echo ==========================================
echo   EMERGENCY SERVERLESS FIX - BYPASSING ISSUES
echo ==========================================

cd /d "c:\Users\acer\qr mun"

echo ✅ Created: Ultra-simple working API (api/working.js)
echo ✅ Created: Simplified main API (api/simple-main.js)
echo ✅ These bypass all complex initialization issues
echo.

echo Adding files...
git add api/working.js api/simple-main.js

echo Committing emergency fix...
git commit -m "EMERGENCY: Add ultra-simple APIs to bypass serverless crashes

- api/working.js: Basic functionality test
- api/simple-main.js: Simplified main API
- No complex imports or initialization
- Direct Supabase client usage
- Should resolve FUNCTION_INVOCATION_FAILED"

echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   ✅ EMERGENCY FIX UPLOADED!
    echo ==========================================
    echo.
    echo 🎯 Test these NEW endpoints after deployment:
    echo - /api/working (basic test)
    echo - /api/simple-main (main functionality)
    echo.
    echo These should work even if the main API crashes!
) else (
    echo ❌ Upload failed
)

pause
