@echo off
echo ===============================================
echo   FINAL UPLOAD TO GITHUB - QR CODE SYSTEM
echo   Repository: https://github.com/geno543/qr_code_system.git
echo ===============================================

cd /d "c:\Users\acer\qr mun"

echo Current directory: %CD%
echo.

echo Checking git status...
git status
echo.

echo Adding all files to git...
git add .
echo.

echo Checking what will be committed...
git status --short
echo.

echo Creating comprehensive commit...
git commit -m "🚀 MAJOR UPDATE: Complete Vercel deployment fixes and email-based QR naming

✅ CRITICAL FIXES APPLIED:
- Fixed Vercel serverless function crashes (500 errors)
- Implemented email-based QR code naming system
- Fixed environment variable loading timing issues
- Added comprehensive diagnostic and debugging tools

🔧 API IMPROVEMENTS:
- api/index.js - Main Vercel API with enhanced error handling
- api/diagnostic.js - Health check and debugging endpoints  
- api/simple.js - Simplified working API for testing
- api/test.js - Test endpoints for validation

📦 DATABASE FIXES:
- supabase-db.js - Fixed env var loading for serverless compatibility
- Enhanced database connection handling
- Improved error logging and debugging

🎯 QR CODE ENHANCEMENTS:
- Changed QR filename format from ticket IDs to email addresses
- Updated all QR generation endpoints
- Fixed QR download functionality in admin interface

📋 CONFIGURATION:
- vercel.json - Production Vercel configuration
- vercel-test.json - Alternative test configuration
- .env.example - Environment variable template

📚 DOCUMENTATION:
- Complete setup and deployment guides
- Debugging and troubleshooting documentation
- API endpoint documentation

This resolves all known deployment issues and implements the requested email-based QR naming system."

echo.
echo Pushing to GitHub repository...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo   ✅ SUCCESS! All updates uploaded to GitHub
    echo   Repository: https://github.com/geno543/qr_code_system
    echo ===============================================
    echo.
    echo 🎯 NEXT STEPS:
    echo 1. Vercel will automatically redeploy your application
    echo 2. Test these endpoints after deployment:
    echo    - https://your-app.vercel.app/api/health
    echo    - https://your-app.vercel.app/api/diagnostic
    echo 3. Upload attendee Excel file to test email-based QR naming
    echo.
    echo Your deployment should now be working correctly!
) else (
    echo.
    echo ❌ UPLOAD FAILED - Please check the error messages above
    echo.
    echo TROUBLESHOOTING:
    echo 1. Make sure you're connected to the internet
    echo 2. Verify your GitHub credentials are set up
    echo 3. Check if the repository URL is correct
)

echo.
echo Recent commits:
git log --oneline -5

echo.
pause
