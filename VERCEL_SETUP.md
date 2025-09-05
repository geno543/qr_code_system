# 🚀 Vercel Production Deployment Guide

## Environment Variables for Vercel

**CRITICAL**: You must add these environment variables in your Vercel dashboard for the production deployment to work:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your `qr-code-system` project
- Go to **Settings** → **Environment Variables**

### 2. Add These Variables:

```
SUPABASE_URL=https://pwadpkjhlybqgwafersz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3YWRwa2pobHlicWd3YWZlcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDMwNzcsImV4cCI6MjA3MjY3OTA3N30.JGT7W6CUEWO0ABGBq1Xal22o0zNCpITkBqh0Newazjg
ADMIN_PASSWORD=genoo
NODE_ENV=production
```

### 3. How to Add Variables:
1. Click **Add New**
2. Enter the **Name** (e.g., `SUPABASE_URL`)
3. Enter the **Value** (e.g., `https://pwadpkjhlybqgwafersz.supabase.co`)
4. Set **Environment** to `Production, Preview, Development`
5. Click **Save**
6. Repeat for all 4 variables

### 4. Redeploy
After adding all environment variables:
- Go to **Deployments** tab
- Click the **3 dots** on the latest deployment
- Click **Redeploy**

## What This Fixes

✅ **Before**: Demo page with static content  
✅ **After**: Full QR Event Management System with:
- File upload functionality
- Real Supabase database integration
- QR code generation and storage
- Admin dashboard with live data
- Scanner with duplicate prevention
- All production features

## Verification

Once deployed with environment variables, your Vercel site will show:
- Upload page at root URL
- Working admin dashboard at `/admin`
- Functional QR scanner at `/scanner`
- All data stored in your Supabase database

## Local vs Production

Both environments now use the same Supabase database:
- **Local**: http://localhost:3000 (Supabase Production DB)
- **Vercel**: Your live URL (Same Supabase Production DB)
- **Data Sync**: Changes in either environment reflect immediately

Your deployment will be fully functional once the environment variables are configured! 🎉
