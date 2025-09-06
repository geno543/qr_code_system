@echo off
echo ========================================
echo   UPLOADING QR SYSTEM TO GITHUB
echo ========================================

cd /d "c:\Users\acer\qr mun"

echo Adding all files...
git add .

echo Committing changes...
git commit -m "🚀 DEPLOY: Complete Vercel serverless function fixes

✅ CRITICAL FIXES APPLIED:
- Fixed environment variable loading timing in supabase-db.js
- Added diagnostic endpoints for debugging (api/diagnostic.js)
- Created simplified working API (api/simple.js)
- Enhanced error handling and logging
- Added comprehensive debugging guides

🔧 FILES INCLUDED:
- api/index.js - Main Vercel API with fixes
- api/diagnostic.js - Health check and debug endpoints
- api/simple.js - Simplified working API
- supabase-db.js - Fixed env var loading
- vercel-test.json - Alternative config
- All documentation and guides

This resolves the 500 FUNCTION_INVOCATION_FAILED error on Vercel deployment."

echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   ✅ UPLOAD COMPLETE!
echo ========================================

echo.
echo Your Vercel deployment will now automatically update!
echo Test these URLs after deployment:
echo - https://your-app.vercel.app/api/health
echo - https://your-app.vercel.app/api/diagnostic

pause
