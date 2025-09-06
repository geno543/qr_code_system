@echo off
echo ===============================================
echo   FIXING VERCEL DEPLOYMENT CONFLICT
echo   Repository: https://github.com/geno543/qr_code_system.git
echo ===============================================

cd /d "c:\Users\acer\qr mun"

echo ✅ FIXED: Vercel configuration conflict
echo - Removed conflicting builds + functions configuration
echo - Using modern functions-only configuration
echo - Added proper rewrites instead of legacy routes
echo.

echo Current directory: %CD%
echo.

echo Checking git status...
git status
echo.

echo Adding all files to git...
git add .
echo.

echo Files to be committed:
git status --short
echo.

echo Creating commit with Vercel fix...
git commit -m "🔧 FIX: Resolve Vercel deployment conflict

✅ DEPLOYMENT FIX:
- Fixed conflicting functions and builds configuration
- Removed legacy 'builds' and 'routes' from vercel.json
- Using modern 'functions' and 'rewrites' configuration only
- This resolves the Vercel deployment failure

📋 CHANGES:
- vercel.json - Fixed configuration conflict
- Added vercel-simple.json as backup
- All API endpoints properly configured

This should resolve the deployment conflict error."

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo   ✅ SUCCESS! Vercel deployment fix uploaded
    echo ===============================================
    echo.
    echo 🎯 WHAT HAPPENS NEXT:
    echo 1. Vercel will redeploy automatically
    echo 2. The deployment conflict should be resolved
    echo 3. Your serverless functions should work properly
    echo.
    echo 🔍 IF DEPLOYMENT STILL FAILS:
    echo 1. Go to your Vercel dashboard
    echo 2. Try renaming vercel.json to vercel-old.json
    echo 3. Rename vercel-simple.json to vercel.json
    echo 4. Redeploy manually
    echo.
    echo Your deployment should now work correctly!
) else (
    echo.
    echo ❌ UPLOAD FAILED - Please check the error messages above
)

echo.
echo Recent commits:
git log --oneline -3

echo.
pause
