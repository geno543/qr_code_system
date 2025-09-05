@echo off
echo 🚀 Starting QR Code System upload to GitHub...

cd /d "%~dp0"

echo 🔗 Setting up GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/geno543/qr_code_system.git

echo 📋 Adding all files to git...
git add .

echo 💾 Committing changes...
git commit -m "Complete QR Event Management System with Supabase Integration - QR code generation and storage using Supabase Storage - Real-time admin dashboard with auto-refresh - Duplicate scan detection and prevention - Excel/CSV file upload for attendee data - QR code scanner with validation - Admin status management and bulk operations - Cloud storage for QR codes and photos - Complete event management workflow"

echo 🌟 Setting main branch...
git branch -M main

echo 📤 Pushing to GitHub...
git push -u origin main

echo ✅ Successfully uploaded QR Code System to GitHub!
echo 🌐 Repository: https://github.com/geno543/qr_code_system
echo.
echo 📋 Next steps:
echo 1. Set up Supabase project
echo 2. Configure environment variables  
echo 3. Deploy to your preferred hosting platform
echo.
echo 📖 Check README.md for detailed setup instructions

pause
