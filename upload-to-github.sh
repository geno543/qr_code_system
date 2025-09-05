#!/bin/bash

# QR Code System - Git Upload Script
# This script uploads the complete project to GitHub

echo "🚀 Starting QR Code System upload to GitHub..."

# Change to project directory
cd "$(dirname "$0")"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add remote origin (remove if exists)
echo "🔗 Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/geno543/qr_code_system.git

# Add all files
echo "📋 Adding all files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Complete QR Event Management System

Features:
- QR code generation with Supabase Storage
- Real-time admin dashboard with auto-refresh
- Duplicate scan detection and prevention
- Excel/CSV file upload for attendee data
- QR code scanner with live validation
- Admin status management and bulk operations
- Cloud storage integration
- Complete event management workflow

Technical Stack:
- Node.js + Express
- Supabase (Database + Storage)
- EJS Templates + Bootstrap 5
- Real-time updates and authentication"
fi

# Set main branch
echo "🌟 Setting main branch..."
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main --force

echo "✅ Successfully uploaded QR Code System to GitHub!"
echo "🌐 Repository: https://github.com/geno543/qr_code_system"
echo ""
echo "📋 Next steps:"
echo "1. Set up Supabase project"
echo "2. Configure environment variables"
echo "3. Deploy to your preferred hosting platform"
echo ""
echo "📖 Check README.md for detailed setup instructions"
