@echo off
echo =================================
echo   GIT PUSH TO GITHUB - QR SYSTEM
echo =================================

cd /d "c:\Users\acer\qr mun"

echo Current directory:
cd

echo.
echo Git status:
git status

echo.
echo Adding all files...
git add .

echo.
echo Current status after add:
git status --short

echo.
echo Creating commit...
git commit -m "Fix Vercel serverless function crashes

✅ FIXES APPLIED:
- Fixed environment variable loading in supabase-db.js
- Added lazy database initialization 
- Created diagnostic endpoints for debugging
- Enhanced error handling and logging
- Added simplified API for testing

🔧 FILES MODIFIED:
- supabase-db.js - Fixed env var loading timing
- api/simple.js - Simplified working API
- api/diagnostic.js - Debug endpoints
- vercel-test.json - Test configuration
- VERCEL_DEBUGGING_GUIDE.md - Instructions

This should resolve the 500 FUNCTION_INVOCATION_FAILED error on Vercel."

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo =================================
echo   UPLOAD COMPLETED!
echo =================================

echo.
echo Verifying upload...
git log --oneline -3

pause
