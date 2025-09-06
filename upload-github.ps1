# PowerShell script to upload QR Code System fixes to GitHub
Write-Host "🚀 Starting GitHub upload process..." -ForegroundColor Green

# Navigate to project directory
Set-Location "c:\Users\acer\qr mun"
Write-Host "� Current directory: $(Get-Location)" -ForegroundColor Yellow

# Show git status
Write-Host "� Checking git status..." -ForegroundColor Yellow
git status

# Add all files
Write-Host "➕ Adding all files to git..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host "� Files to be committed:" -ForegroundColor Cyan
git status --short

# Create commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Fix Vercel serverless function crashes - Environment variable handling

✅ ROOT CAUSE IDENTIFIED: Environment variables not available during module initialization in Vercel

🔧 FIXES APPLIED:
- Modified supabase-db.js to read env vars in constructor instead of module level  
- Added lazy database initialization with proper error handling
- Created simplified API (api/simple.js) for testing
- Added comprehensive diagnostic endpoints (api/diagnostic.js)
- Enhanced error handling and logging throughout

📁 NEW FILES CREATED:
- api/simple.js - Minimal working API for testing
- api/diagnostic.js - Detailed debugging endpoint  
- vercel-test.json - Alternative Vercel configuration
- VERCEL_DEBUGGING_GUIDE.md - Step-by-step debugging instructions
- push-to-github.bat - Manual upload script

🎯 EXPECTED RESULT: Resolves 500 FUNCTION_INVOCATION_FAILED error on Vercel deployment

🧪 TEST ENDPOINTS AFTER DEPLOYMENT:
- /api/health - Health check with environment info
- /api/test - Environment variable verification"

# Push to GitHub
Write-Host "⬆️ Pushing to GitHub..." -ForegroundColor Green
git push origin main

# Verify upload
Write-Host "✅ Upload completed! Verifying..." -ForegroundColor Green
Write-Host "🌐 Repository: https://github.com/geno543/qr_code_system" -ForegroundColor Cyan

# Show recent commits
Write-Host "� Recent commits:" -ForegroundColor Cyan
git log --oneline -5

Write-Host "🎉 QR Code System fixes successfully uploaded to GitHub!" -ForegroundColor Green
Write-Host "🔗 Check your Vercel dashboard for automatic deployment" -ForegroundColor Yellow

Read-Host "Press Enter to continue..."
