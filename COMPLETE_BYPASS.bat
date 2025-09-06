@echo off
echo ==========================================
echo   COMPLETE SERVERLESS BYPASS SOLUTION
echo ==========================================

cd /d "c:\Users\acer\qr mun"

echo Step 1: Backup problematic main API
if exist api\index.js (
    copy api\index.js api\index-backup.js
    echo ✅ Backed up api/index.js
)

echo Step 2: Replace main API with simplified version
copy api\simple-main.js api\index.js
echo ✅ Replaced main API with simplified version

echo Step 3: Add all changes
git add .

echo Step 4: Commit bypass solution
git commit -m "BYPASS: Replace complex API with simplified version

- Backup: api/index.js -> api/index-backup.js  
- Replace: api/index.js with simplified version
- Add: api/working.js for basic testing
- No complex imports or Express setup
- Direct Supabase client, minimal dependencies
- Should completely resolve serverless crashes"

echo Step 5: Push to GitHub
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   ✅ COMPLETE BYPASS SOLUTION DEPLOYED!
    echo ==========================================
    echo.
    echo 🎯 Your main API is now ultra-simplified
    echo 🎯 Test: /api/health (should work now)
    echo 🎯 Test: /api/working (basic test)
    echo 🎯 Test: /api/attendees (get data)
    echo.
    echo This completely bypasses the serverless crash!
) else (
    echo ❌ Deploy failed
)

pause
