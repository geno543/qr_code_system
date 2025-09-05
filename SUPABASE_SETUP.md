# Supabase Database Setup Guide

## Step 1: Login to Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Login to your account where you have the project: `pwadpkjhlybqgwafersz`

## Step 2: Navigate to SQL Editor
1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click on "New Query" or use an existing query tab

## Step 3: Run the Database Setup Script
Copy and paste the entire contents of `setup-supabase.sql` into the SQL Editor and click "Run".

The script will create:
- `attendees` table with all necessary columns
- Indexes for better performance
- Row Level Security (RLS) policies for data protection
- Storage buckets for QR codes and photos
- Sample data (optional - you can remove the INSERT statements if you don't want sample data)

## Step 4: Verify Setup
After running the script, you should see:
1. A new table called `attendees` in the Table Editor
2. Storage buckets named `qr-codes` and `photos` in the Storage section

## Step 5: Test Your Application
1. Your Node.js server should already be running
2. Visit `http://localhost:3000/admin` 
3. Use password: `genoo`
4. Try uploading an Excel file to test the integration

## Current Configuration
Your application is configured with:
- **Supabase URL**: https://pwadpkjhlybqgwafersz.supabase.co
- **Database**: PostgreSQL (cloud)
- **Storage**: Supabase Storage (for QR codes and photos)
- **Authentication**: Simple password protection

## Next Steps for Deployment
Once the database is set up, your application will be ready for deployment on platforms like:
- Vercel
- Netlify
- Railway
- Heroku

All database operations now use Supabase instead of local SQLite, making your application cloud-ready!

## Troubleshooting
If you encounter any issues:
1. Check that the SQL script ran without errors
2. Verify your Supabase URL and API key in the `.env` file
3. Make sure RLS policies allow your operations
4. Check the browser console and server logs for any error messages
