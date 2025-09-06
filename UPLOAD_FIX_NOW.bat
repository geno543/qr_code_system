@echo off
echo ==========================================
echo   UPLOADING CRITICAL SERVERLESS FIX
echo ==========================================

cd /d "c:\Users\acer\qr mun"

echo ✅ Fixed: Export class instead of instance in supabase-db.js
echo ✅ Added: Minimal test API for debugging
echo.

echo Current files being uploaded:
echo - supabase-db.js (CRITICAL FIX)
echo - api/test-minimal.js (debugging endpoint)
echo.

git add .
git commit -m "URGENT: Fix serverless crash

- Export SupabaseDB class not instance (prevents constructor crash)
- Add minimal test API for debugging
- This fixes FUNCTION_INVOCATION_FAILED error"

git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   ✅ CRITICAL FIX UPLOADED SUCCESSFULLY!
    echo ==========================================
    echo.
    echo 🎯 Test URLs after redeployment (2-3 minutes):
    echo - /api/test-minimal (basic test)
    echo - /api/health (full health check)
    echo.
    echo This should fix the FUNCTION_INVOCATION_FAILED error!
) else (
    echo ❌ Upload failed - check git status
)

pause
