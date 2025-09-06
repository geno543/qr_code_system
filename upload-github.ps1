# PowerShell script to upload QR Code System to GitHub
Write-Host "🚀 Starting GitHub upload process..." -ForegroundColor Green

# Navigate to project directory
Set-Location "c:\Users\acer\qr mun"

# Initialize git if needed
Write-Host "📋 Initializing Git repository..." -ForegroundColor Yellow
git init

# Add remote repository
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/geno543/qr_code_system.git

# Configure git user (if needed)
git config user.name "geno543" 2>$null
git config user.email "your-email@example.com" 2>$null

# Add all files
Write-Host "📁 Adding all files to git..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Complete QR Event Management System - Mobile optimized QR scanner with camera support - Supabase cloud database integration - Fixed QR image naming with ticket IDs - Bulk download functionality - Admin dashboard with real-time updates - Vercel deployment ready - Complete documentation"

# Set main branch
Write-Host "🌟 Setting main branch..." -ForegroundColor Yellow
git branch -M main

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host "🌐 Repository: https://github.com/geno543/qr_code_system" -ForegroundColor Cyan

# Verify upload
Write-Host "🔍 Verifying upload..." -ForegroundColor Yellow
git log --oneline -3

Write-Host "📋 Repository contents:" -ForegroundColor Yellow
git ls-files | Select-Object -First 20

Write-Host "🎉 QR Code System successfully uploaded to GitHub!" -ForegroundColor Green
