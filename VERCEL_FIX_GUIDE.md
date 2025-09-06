# 🚨 Vercel Deployment Fix Guide

## Problem: 500 INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED

### Immediate Fix Steps:

1. **Test with Simple API First**
   ```bash
   # Deploy the test API first to verify basic functionality
   cd "c:\Users\acer\qr mun"
   git add api/test.js
   git commit -m "Add test API for debugging"
   git push origin main
   ```

2. **Check Environment Variables in Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your project: `qr-event-system`
   - Go to Settings → Environment Variables
   - Add these required variables:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_key
     NODE_ENV=production
     ```

3. **Update Vercel Configuration**
   The `vercel.json` has been updated with:
   - Proper build configuration
   - Function timeout settings
   - Route handling

### Root Causes & Solutions:

#### Cause 1: Missing Environment Variables
**Solution**: Set environment variables in Vercel dashboard:
1. Login to Vercel
2. Go to Project Settings
3. Environment Variables tab
4. Add SUPABASE_URL and SUPABASE_ANON_KEY

#### Cause 2: Database Connection Issues
**Solution**: The API now includes:
- Async database initialization
- Health check endpoint (`/api/health`)
- Error handling for missing environment variables

#### Cause 3: Function Timeout/Size Issues
**Solution**: Updated `vercel.json` with:
- `maxLambdaSize: "50mb"`
- `maxDuration: 30` seconds
- Proper routing configuration

### Testing Steps:

1. **Deploy Current Changes**
   ```bash
   git add .
   git commit -m "Fix Vercel serverless function configuration"
   git push origin main
   ```

2. **Test Endpoints After Deployment**
   - Test: `https://your-domain.vercel.app/api/health`
   - Test: `https://your-domain.vercel.app/api/test`

3. **Check Vercel Logs**
   - Go to Vercel dashboard
   - Check Function logs for detailed error messages

### Alternative Deployment Method:

If issues persist, you can:

1. **Use the Test API temporarily**
   - Replace `api/index.js` with `api/test.js` content
   - This provides a minimal working API to verify deployment

2. **Gradually add features back**
   - Start with basic endpoints
   - Add database functionality once environment is confirmed working

### Environment Variables Required:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

### Updated Files:
- ✅ `api/index.js` - Enhanced error handling
- ✅ `vercel.json` - Improved configuration
- ✅ `api/test.js` - Minimal test API

### Next Steps:
1. Push changes to GitHub
2. Set environment variables in Vercel
3. Test the deployment
4. Check Vercel function logs if issues persist
