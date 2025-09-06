@echo off
echo ==========================================
echo   FINAL VERCEL DEPLOYMENT FIX
echo ==========================================

cd /d "c:\Users\acer\qr mun"

echo Step 1: Backup current vercel.json
copy vercel.json vercel-backup.json

echo Step 2: Create minimal vercel.json
echo {> vercel.json
echo   "version": 2,>> vercel.json
echo   "functions": {>> vercel.json
echo     "api/index.js": {>> vercel.json
echo       "maxDuration": 30>> vercel.json
echo     }>> vercel.json
echo   }>> vercel.json
echo }>> vercel.json

echo Step 3: Check the new configuration
type vercel.json

echo Step 4: Add and commit changes
git add .
git commit -m "FINAL FIX: Ultra-minimal Vercel configuration"

echo Step 5: Push to GitHub
git push origin main

echo.
echo ==========================================
echo   DEPLOYMENT FIX COMPLETE!
echo ==========================================
echo.
echo This minimal configuration should work.
echo Wait 2-3 minutes for Vercel to redeploy.
echo.
pause
