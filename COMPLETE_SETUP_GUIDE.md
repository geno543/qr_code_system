# QR Event Management System - Complete Setup Guide

## 🚀 System Status
- ✅ **Local Development**: Working on http://localhost:3001
- ✅ **Production Deployment**: Available on Vercel
- ✅ **Database**: Supabase PostgreSQL + Storage
- ✅ **Repository**: https://github.com/geno543/qr_code_system.git

## 🔧 Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Git
- Text editor (VS Code recommended)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/geno543/qr_code_system.git
cd qr_code_system

# Install dependencies
npm install

# Start the development server
npm start
```

### Access Points
- **Main App**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3001/admin (Password: `genoo`)
- **QR Scanner**: http://localhost:3001/scanner
- **Health Check**: http://localhost:3001/health

## 🌐 Production Deployment

### Vercel Deployment
The system is deployed on Vercel with the following configuration:

**Environment Variables Required:**
```env
SUPABASE_URL=https://pwadpkjhlybqgwafersz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PASSWORD=genoo
NODE_ENV=production
```

### Vercel Setup Steps
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the GitHub repository
3. Set environment variables in Settings → Environment Variables
4. Deploy automatically triggers on push to main branch

## 📊 Database Configuration

### Supabase Setup
The system uses Supabase for both database and file storage:

**Database Table**: `attendees`
```sql
CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    attendee_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    token VARCHAR(255) UNIQUE NOT NULL,
    qr_code TEXT,
    scanned BOOLEAN DEFAULT FALSE,
    scan_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage Buckets**:
- `qr-codes` - Stores QR code images (public access)
- `photos` - Stores profile photos (public access)

## 🎯 Core Features

### 1. File Upload & QR Generation
- Upload Excel files with attendee data
- Automatically generates unique QR codes
- Stores QR codes in Supabase Storage
- Supports columns: Name, Ticket_ID/ID, Email

### 2. QR Code Scanning
- Real-time QR code validation
- One-time use security (prevents duplicate scans)
- Mobile-friendly scanner interface
- Instant feedback and status updates

### 3. Admin Dashboard
- Real-time attendance monitoring
- Manual status toggle for attendees
- Export functionality (CSV/JSON)
- Auto-refresh every 10 seconds

### 4. Security Features
- Session-based authentication
- Token-based QR validation
- Environment variable configuration
- Error handling and graceful degradation

## 🔍 Troubleshooting

### Common Issues

**Port 3000 Already in Use**
- Solution: Server now runs on port 3001
- VPN services often use port 3000

**Database Connection Errors**
- Verify Supabase environment variables
- Check network connectivity
- Ensure Supabase project is active

**QR Codes Not Loading**
- Verify Supabase Storage buckets exist
- Check bucket permissions (should be public)
- Ensure file upload permissions

**Template Rendering Errors**
- Ensure all EJS templates are present in `/views`
- Check for syntax errors in templates
- Verify Bootstrap CSS/JS links

### Debug Commands
```bash
# Check environment variables
curl http://localhost:3001/debug/env

# Health check
curl http://localhost:3001/health

# Test database connection
node -e "const db = require('./supabase-db'); db.getAllAttendees().then(console.log).catch(console.error);"
```

## 📁 File Structure
```
qr_code_system/
├── api/
│   └── index.js          # Vercel serverless API
├── public/
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   └── images/          # Static images
├── views/
│   ├── index.ejs        # Homepage
│   ├── admin-simple.ejs # Admin dashboard
│   ├── admin-login.ejs  # Admin login
│   └── scanner.ejs      # QR scanner
├── server.js            # Main Express server
├── supabase-db.js       # Database abstraction layer
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel configuration
└── .env                 # Environment variables
```

## 🚦 Development Workflow

### Making Changes
1. Make your changes locally
2. Test on http://localhost:3001
3. Commit and push to main branch
4. Vercel automatically redeploys

### Testing Checklist
- [ ] File upload works correctly
- [ ] QR codes generate and display
- [ ] Scanner validates QR codes
- [ ] Admin dashboard shows real-time data
- [ ] Export functionality works
- [ ] No console errors

## 🔒 Security Notes

- Environment variables are never committed to Git
- Admin password should be strong in production
- Supabase keys are environment-specific
- QR tokens are UUIDs for security
- Session tokens expire after 24 hours

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check Vercel deployment logs
4. Verify Supabase dashboard for database issues

## 🎉 Success Metrics

The system is working correctly when:
- ✅ Local server starts without errors
- ✅ Files upload and process successfully
- ✅ QR codes generate and display properly
- ✅ Scanner validates codes correctly
- ✅ Admin dashboard updates in real-time
- ✅ Production deployment is accessible
