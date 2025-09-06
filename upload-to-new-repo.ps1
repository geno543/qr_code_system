# PowerShell script to upload QR Code System to new GitHub repository
# Repository: https://github.com/geno543/qr_code_system.git

Write-Host "Starting upload to new repository..." -ForegroundColor Green

# Navigate to project directory
Set-Location "c:\Users\acer\qr mun"

# Check if this is already a git repository
if (Test-Path ".git") {
    Write-Host "Git repository detected. Checking current remotes..." -ForegroundColor Yellow
    git remote -v
    
    # Remove old origin if it exists
    git remote remove origin 2>$null
    Write-Host "Removed old origin (if existed)" -ForegroundColor Yellow
} else {
    Write-Host "Initializing new git repository..." -ForegroundColor Yellow
    git init
}

# Add the new remote repository
Write-Host "Adding new remote repository..." -ForegroundColor Yellow
git remote add origin https://github.com/geno543/qr_code_system.git

# Check git status
Write-Host "Current git status:" -ForegroundColor Cyan
git status

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore file..." -ForegroundColor Yellow
    @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite
*.sqlite3

# Generated files
public/qr/
public/photos/
qr-codes-export.zip

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Backup files
*.bak
*~backup*
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Add all files to staging
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: QR Event Management System

Features:
- Upload Excel files with attendee data
- Generate unique QR codes for each attendee
- Real-time QR code scanning and validation
- One-time use security (QR codes become invalid after scanning)
- Admin dashboard with attendance tracking
- Export capabilities (CSV, JSON)
- Email-based QR code naming
- Supabase integration for cloud storage
- Vercel deployment ready

Technology Stack:
- Node.js & Express.js
- Supabase for database and storage
- QR code generation and scanning
- Bootstrap UI
- EJS templating"

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host "Upload completed successfully!" -ForegroundColor Green
Write-Host "Repository URL: https://github.com/geno543/qr_code_system" -ForegroundColor Cyan

# Show final status
Write-Host "`nFinal repository status:" -ForegroundColor Cyan
git remote -v
git status
