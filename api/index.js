// Vercel Serverless API - Complete QR Event Management System
const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Import database
const Database = require('../supabase-db');

// Initialize
const app = express();
const db = new Database();

// Load environment variables
require('dotenv').config();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Session management (use Redis in production)
let adminSessions = new Set();

// File upload configuration
const upload = multer({
    dest: '/tmp/uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// =======================
// MAIN ROUTES
// =======================

// Home page - Upload interface
app.get('/', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        const stats = {
            total: attendees.length,
            scanned: attendees.filter(a => a.scanned).length,
            pending: attendees.filter(a => !a.scanned).length
        };
        res.render('index', { stats });
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.render('index', { stats: { total: 0, scanned: 0, pending: 0 } });
    }
});

// Admin login page
app.get('/admin/login', (req, res) => {
    res.render('admin-login');
});

// Admin authentication
app.post('/admin/auth', async (req, res) => {
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (password === adminPassword) {
            const token = uuidv4();
            adminSessions.add(token);
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: 'Invalid password' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ success: false, message: 'Authentication failed' });
    }
});

// Admin dashboard
app.get('/admin', async (req, res) => {
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    
    if (!token || !adminSessions.has(token)) {
        return res.redirect('/admin/login');
    }

    try {
        const attendees = await db.getAllAttendees();
        const stats = {
            total: attendees.length,
            scanned: attendees.filter(a => a.scanned).length,
            pending: attendees.filter(a => !a.scanned).length
        };
        res.render('admin-simple', { attendees, stats, token });
    } catch (error) {
        console.error('Error loading admin:', error);
        res.render('admin-simple', { 
            attendees: [], 
            stats: { total: 0, scanned: 0, pending: 0 }, 
            token 
        });
    }
});

// QR Scanner
app.get('/scanner', (req, res) => {
    res.render('scanner');
});

// =======================
// API ENDPOINTS
// =======================

// File upload and QR generation
app.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        console.log('Processing file:', req.file.originalname);
        
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} rows in Excel file`);

        let processed = 0;
        let errors = [];
        
        for (const row of data) {
            try {
                // Check for required fields
                const name = row.Name || row.name;
                const ticketId = row.Ticket_ID || row['Ticket ID'] || row.ID || row.id;
                
                if (!name || !ticketId) {
                    errors.push(`Row missing required data: Name="${name}", ID="${ticketId}"`);
                    continue;
                }

                // Create attendee data
                const attendeeData = {
                    name: name.toString().trim(),
                    attendee_id: ticketId.toString().trim(),
                    email: row.Email || row.email || '',
                    token: uuidv4(),
                    scanned: false
                };
                
                console.log(`Processing: ${attendeeData.name} (${attendeeData.attendee_id})`);
                
                // Generate QR code data
                const qrData = JSON.stringify({
                    token: attendeeData.token,
                    name: attendeeData.name,
                    ticketId: attendeeData.attendee_id,
                    event: 'QR MUN Event'
                });
                
                // Generate QR code as PNG buffer
                const qrBuffer = await QRCode.toBuffer(qrData, {
                    type: 'png',
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                
                // Upload to Supabase Storage and save attendee
                const qrUrl = await db.uploadQRCode(attendeeData.token, qrBuffer);
                attendeeData.qr_code = qrUrl;
                
                await db.createAttendee(attendeeData);
                processed++;
                
            } catch (rowError) {
                console.error(`Error processing row:`, rowError);
                errors.push(`Error with ${row.Name || 'unknown'}: ${rowError.message}`);
            }
        }

        console.log(`Upload complete: ${processed} processed, ${errors.length} errors`);

        res.json({
            success: true,
            message: `Successfully processed ${processed} attendees${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
            processed,
            errors: errors.slice(0, 10) // Show first 10 errors
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: `Upload failed: ${error.message}`
        });
    }
});

// QR code validation and scanning
app.post('/validate-qr', async (req, res) => {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.json({
                success: false,
                message: '❌ No QR data provided'
            });
        }

        // Parse QR data
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch {
            parsedData = { token: qrData.trim() };
        }

        const token = parsedData.token;
        if (!token) {
            return res.json({
                success: false,
                message: '❌ Invalid QR Code Format'
            });
        }

        console.log(`Validating QR token: ${token.substring(0, 8)}...`);

        // Find attendee by token
        const attendee = await db.getAttendeeByToken(token);
        if (!attendee) {
            console.log('Token not found in database');
            return res.json({
                success: false,
                message: '❌ QR Code Not Found'
            });
        }

        // Check if already scanned
        if (attendee.scanned) {
            console.log(`Already scanned: ${attendee.name}`);
            return res.json({
                success: false,
                message: '⚠️ Already Scanned',
                details: `${attendee.name} was already checked in${attendee.scan_time ? ' on ' + new Date(attendee.scan_time).toLocaleString() : ''}`
            });
        }

        // Mark as scanned
        await db.markAttendeeScanned(attendee.id);
        console.log(`Successfully checked in: ${attendee.name}`);

        res.json({
            success: true,
            message: '✅ Welcome!',
            details: `Successfully checked in ${attendee.name}`,
            attendee: {
                name: attendee.name,
                ticketId: attendee.ticket_id || attendee.attendee_id,
                scanTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('QR validation error:', error);
        res.json({
            success: false,
            message: `❌ System Error: ${error.message}`
        });
    }
});

// Get all attendees (admin)
app.get('/admin/attendees', requireAuth, async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        res.json(attendees);
    } catch (error) {
        console.error('Error fetching attendees:', error);
        res.status(500).json({ error: 'Failed to fetch attendees' });
    }
});

// Toggle attendee status (admin)
app.post('/admin/toggle-status/:id', requireAuth, async (req, res) => {
    try {
        const attendeeId = req.params.id;
        const attendee = await db.getAttendeeById(attendeeId);
        
        if (!attendee) {
            return res.status(404).json({ error: 'Attendee not found' });
        }

        const newStatus = !attendee.scanned;
        await db.updateAttendeeStatus(attendeeId, newStatus);
        
        console.log(`Status toggled for ${attendee.name}: ${newStatus}`);
        res.json({ success: true, scanned: newStatus });
        
    } catch (error) {
        console.error('Error toggling status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Export attendees (admin)
app.get('/admin/export/:format', requireAuth, async (req, res) => {
    try {
        const format = req.params.format.toLowerCase();
        const attendees = await db.getAllAttendees();
        
        if (format === 'csv') {
            const csv = [
                'Name,Ticket ID,Email,Scanned,Scan Time',
                ...attendees.map(a => 
                    `"${a.name}","${a.ticket_id || a.attendee_id}","${a.email || ''}","${a.scanned}","${a.scan_time || ''}"`
                )
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="attendees.csv"');
            res.send(csv);
        } else {
            res.json(attendees);
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Health check
app.get('/health', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production',
            database: 'supabase',
            attendees: attendees.length,
            scanned: attendees.filter(a => a.scanned).length
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Debug endpoint
app.get('/debug/env', (req, res) => {
    res.json({
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        nodeEnv: process.env.NODE_ENV
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
    });
});

// Export for Vercel
module.exports = app;