@echo off
echo Uploading QR Code System to GitHub...
cd "c:\Users\acer\qr mun"

echo Step 1: Initialize git
git init

echo Step 2: Add remote
git remote remove origin
git remote add origin https://github.com/geno543/qr_code_system.git

echo Step 3: Add files
git add .

echo Step 4: Commit
git commit -m "Complete QR Event Management System with mobile scanner and Supabase integration"

echo Step 5: Set main branch  
git branch -M main

echo Step 6: Push to GitHub
git push -u origin main --force

echo Upload complete!
echo Repository: https://github.com/geno543/qr_code_system
pause
