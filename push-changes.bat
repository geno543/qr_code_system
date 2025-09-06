@echo off
cd "c:\Users\acer\qr mun"
echo Adding all files...
git add .
echo Committing changes...
git commit -m "URGENT: Fix Vercel deployment - add missing api/index.js and complete serverless setup"
echo Pushing to remote...
git push origin main
echo Done!
pause
