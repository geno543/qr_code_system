@echo off
echo Starting upload to GitHub repository...

cd /d "c:\Users\acer\qr mun"

echo Checking git status...
git status

echo Adding all files...
git add .

echo Creating commit...
git commit -m "Updated QR Event Management System with email-based naming

Features updated:
- QR codes now named with email addresses instead of ticket IDs
- Fixed bulk download naming convention
- Updated individual QR download modal
- Consistent email-based naming across all download functions
- Enhanced admin interface functionality"

echo Pushing to GitHub...
git push origin main

echo Upload completed!
pause
