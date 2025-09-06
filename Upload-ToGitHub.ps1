# PowerShell Upload Script for QR Code System
# Repository: https://github.com/geno543/qr_code_system.git

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  UPLOADING TO GITHUB - QR CODE SYSTEM" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Set-Location "c:\Users\acer\qr mun"

Write-Host "`nCurrent directory: $(Get-Location)" -ForegroundColor Yellow

Write-Host "`nChecking git status..." -ForegroundColor Green
git status

Write-Host "`nAdding all files..." -ForegroundColor Green
git add .

Write-Host "`nFiles to be committed:" -ForegroundColor Green
git status --short

Write-Host "`nCreating commit..." -ForegroundColor Green
git commit -m "🚀 DEPLOY: Complete system update with Vercel fixes

✅ MAJOR UPDATES:
- Fixed all Vercel serverless function crashes
- Implemented email-based QR code naming
- Added comprehensive debugging tools
- Enhanced error handling and logging

🔧 FILES UPDATED:
- api/index.js, api/diagnostic.js, api/simple.js
- supabase-db.js with fixed environment loading
- server.js with email-based QR generation
- All admin interface improvements

This resolves deployment issues and implements requested features."

Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n===============================================" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS! Repository updated successfully" -ForegroundColor Green
    Write-Host "  Repository: https://github.com/geno543/qr_code_system" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    
    Write-Host "`n🎯 What happens next:" -ForegroundColor Yellow
    Write-Host "1. Vercel will automatically redeploy" -ForegroundColor White
    Write-Host "2. Test the fixed API endpoints" -ForegroundColor White
    Write-Host "3. Verify email-based QR naming works" -ForegroundColor White
} else {
    Write-Host "`n❌ Upload failed - check error messages above" -ForegroundColor Red
}

Write-Host "`nRecent commits:" -ForegroundColor Cyan
git log --oneline -3

Read-Host "`nPress Enter to continue"
