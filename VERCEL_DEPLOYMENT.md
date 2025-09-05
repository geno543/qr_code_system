# Vercel Deployment Guide

## The Problem
Your original server uses SQLite database which doesn't work in Vercel's serverless environment because:
- Serverless functions can't write to the filesystem
- Each function invocation is stateless
- SQLite requires persistent file storage

## The Solution
I've created a **serverless-compatible version** (`server-vercel.js`) that uses:
- **In-memory storage** instead of SQLite (for demo/testing)
- **Memory-based file uploads** with multer
- **Proper Vercel configuration** in `vercel.json`

## Files Added for Vercel

### 1. `vercel.json` - Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "./server-vercel.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server-vercel.js"
    }
  ]
}
```

### 2. `server-vercel.js` - Serverless-Compatible Server
- Uses in-memory arrays instead of SQLite
- Simplified file handling
- All QR validation logic preserved
- Same admin functionality

### 3. `.env.example` - Environment Variables Template

## How to Deploy to Vercel

### Option 1: Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy from your project directory:
   ```bash
   cd "c:\Users\acer\qr mun"
   vercel
   ```

3. Follow the prompts:
   - Link to existing project? **No**
   - Project name: **qr-code-system**
   - Directory: **./  (current directory)**

### Option 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository: `geno543/qr_code_system`
5. Vercel will automatically detect the configuration

## Important Notes

### ⚠️ Data Persistence
The current Vercel version uses **in-memory storage**, which means:
- Data is lost when the function goes to sleep (after ~5 minutes of inactivity)
- Each new function instance starts with empty data
- **This is only suitable for testing/demo purposes**

### 🔧 For Production Use
You need a **persistent database**. Options:
1. **Vercel Postgres** (recommended)
2. **PlanetScale** (MySQL)
3. **MongoDB Atlas**
4. **Supabase** (PostgreSQL)

### 🚀 Current Functionality
The Vercel version includes:
- ✅ Admin login (password: "genoo")
- ✅ Excel file upload
- ✅ QR code validation
- ✅ Real-time scanner
- ✅ Admin dashboard
- ✅ CSV export
- ⚠️ Data resets periodically (serverless limitation)

## Testing Your Deployment

1. After deployment, you'll get a URL like: `https://qr-code-system-xxx.vercel.app`
2. Test these endpoints:
   - `/` - Home page
   - `/admin` - Admin dashboard
   - `/scanner` - QR scanner
   - `/health` - Health check

## Troubleshooting

### If you still get errors:
1. Check Vercel function logs in the dashboard
2. Ensure all dependencies are in `package.json`
3. Check that `server-vercel.js` is being used (not `server.js`)

### Common issues:
- **Timeout**: Increase `maxDuration` in `vercel.json`
- **Memory limit**: Reduce file upload sizes
- **Missing dependencies**: Run `npm install` and redeploy

## Next Steps

1. **Deploy to Vercel** using one of the methods above
2. **Test the deployment** with the health endpoint
3. **Upload test data** through the admin panel
4. **For production**: Set up a proper database (see Database Migration Guide)

Your GitHub repository is ready for Vercel deployment! 🚀
