const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config();

// Import Supabase database service
const db = require('./supabase-db');

const app = express();
const PORT = process.env.PORT || 3001;

// Admin credentials from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genoo';

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/qr', express.static(path.join(__dirname, 'public/qr')));
app.use('/qr-codes', express.static(path.join(__dirname, 'public/qr-codes')));
app.set('view engine', 'ejs');
app.set('views', './views');

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const session = activeSessions.get(token);
    if (Date.now() > session.expires) {
        activeSessions.delete(token);
        return res.status(401).json({ error: 'Session expired' });
    }
    
    // Extend session
    session.expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    req.user = session.user;
    next();
}

// Generate session token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Admin login page
app.get('/admin/login', (req, res) => {
    res.render('login');
});

// Admin login
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        const token = generateToken();
        activeSessions.set(token, {
            user: 'admin',
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
        
        res.json({ 
            success: true, 
            token: token,
            message: 'Access granted' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Incorrect password' 
        });
    }
});

// Verify session
app.get('/admin/verify', requireAuth, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && activeSessions.has(token)) {
        activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
});

// Debug endpoint to check database data
app.get('/debug/data', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        res.json({
            count: attendees.length,
            data: attendees.slice(0, 2).map(a => ({
                name: a.name,
                hasQrCode: !!a.qr_code,
                qrCodeType: typeof a.qr_code,
                qrCodePrefix: a.qr_code ? a.qr_code.substring(0, 50) + '...' : null
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test storage functionality
app.get('/debug/test-storage', async (req, res) => {
    try {
        // Generate a test QR code
        const testData = JSON.stringify({
            token: 'test-123',
            name: 'Test User',
            ticketId: 'TEST001',
            event: 'QR MUN Event'
        });

        const qrCodeBuffer = await QRCode.toBuffer(testData, {
            width: 300,
            margin: 2
        });

        // Upload to Supabase Storage
        const fileName = `test-qr-${Date.now()}.png`;
        const qrCodeUrl = await db.uploadQRCode(qrCodeBuffer, fileName);

        res.json({
            success: true,
            message: 'Test QR code uploaded successfully',
            url: qrCodeUrl,
            fileName: fileName,
            bufferSize: qrCodeBuffer.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

// Storage diagnostic endpoint
app.get('/debug/storage-info', async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // List buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        let qrCodesBucket = null;
        let files = [];
        
        if (!bucketsError && buckets) {
            qrCodesBucket = buckets.find(b => b.name === 'qr-codes');
            
            // List files in qr-codes bucket
            const { data: filesList, error: filesError } = await supabase.storage
                .from('qr-codes')
                .list();
            
            if (!filesError) {
                files = filesList || [];
            }
        }
        
        res.json({
            success: true,
            buckets: buckets || [],
            qrCodesBucket: qrCodesBucket,
            filesInQrBucket: files.length,
            files: files.slice(0, 10), // Show first 10 files
            env: {
                hasUrl: !!process.env.SUPABASE_URL,
                hasKey: !!process.env.SUPABASE_ANON_KEY,
                urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : null
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

// Test duplicate scan detection
app.get('/debug/test-duplicate-scan', async (req, res) => {
    try {
        // Get first attendee
        const attendees = await db.getAllAttendees();
        if (attendees.length === 0) {
            return res.json({ message: 'No attendees found. Upload some data first.' });
        }
        
        const firstAttendee = attendees[0];
        
        // Test the scan logic directly instead of using fetch
        const token = firstAttendee.token;
        
        // First scan - should work
        let attendee1 = await db.getAttendeeByToken(token);
        const wasScanned1 = attendee1 ? attendee1.scanned : false;
        
        if (attendee1 && !attendee1.scanned) {
            await db.updateAttendeeByToken(token, { 
                scanned: true, 
                scan_time: new Date().toISOString() 
            });
        }
        
        // Second scan - should be duplicate  
        let attendee2 = await db.getAttendeeByToken(token);
        const wasScanned2 = attendee2 ? attendee2.scanned : false;
        
        res.json({
            attendee: firstAttendee.name,
            token: firstAttendee.token.substring(0, 10) + '...',
            test: {
                initiallyScanned: wasScanned1,
                afterFirstScan: wasScanned2,
                duplicateDetected: wasScanned2 === true
            },
            message: wasScanned2 ? 'Duplicate scan detection working correctly!' : 'Issue with duplicate detection'
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Test admin status toggle
app.get('/debug/test-admin-toggle', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        if (attendees.length === 0) {
            return res.json({ message: 'No attendees found. Upload some data first.' });
        }
        
        const attendee = attendees[0];
        const originalStatus = attendee.scanned;
        
        // Toggle status
        await db.updateAttendee(attendee.id, { 
            scanned: !originalStatus, 
            scan_time: !originalStatus ? new Date().toISOString() : null 
        });
        
        // Get updated attendee
        const updatedAttendees = await db.getAllAttendees();
        const updatedAttendee = updatedAttendees.find(a => a.id === attendee.id);
        
        res.json({
            success: true,
            attendee: attendee.name,
            originalStatus: originalStatus,
            newStatus: updatedAttendee.scanned,
            toggled: originalStatus !== updatedAttendee.scanned,
            message: 'Admin status toggle test completed'
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Test endpoint to create storage bucket and upload a test QR code
app.get('/debug/test-storage', async (req, res) => {
    try {
        // Try to create bucket
        const { data: bucketData, error: bucketError } = await db.supabase.storage.createBucket('qr-codes', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg']
        });

        let bucketStatus = 'created';
        if (bucketError) {
            if (bucketError.message.includes('already exists')) {
                bucketStatus = 'already exists';
            } else {
                throw bucketError;
            }
        }

        // Test QR code generation and upload
        const testQRData = JSON.stringify({
            token: 'test-token',
            name: 'Test User',
            ticketId: 'TEST-001'
        });

        const qrCodeBuffer = await QRCode.toBuffer(testQRData, {
            width: 300,
            margin: 2
        });

        const testFileName = 'test-qr-code.png';
        const qrCodeUrl = await db.uploadQRCode(qrCodeBuffer, testFileName);

        res.json({
            success: true,
            bucketStatus,
            testQRCodeUrl: qrCodeUrl,
            message: 'Storage test completed successfully'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test QR code route for debugging
app.get('/test-qr', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test QR Code</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .qr-container { margin: 20px auto; max-width: 300px; }
                img { max-width: 100%; border: 2px solid #333; }
                .instructions { background: #f0f0f0; padding: 20px; margin: 20px auto; max-width: 500px; border-radius: 10px; }
            </style>
        </head>
        <body>
            <h1>Test QR Code</h1>
            <div class="qr-container">
                <img src="/qr/test-qr.png" alt="Test QR Code">
            </div>
            <div class="instructions">
                <h3>How to test:</h3>
                <p>1. Open <a href="/scanner" target="_blank">Scanner</a> in a new tab</p>
                <p>2. Allow camera permissions</p>
                <p>3. Point your camera at this QR code</p>
                <p>4. You should see "QR Code detected! Validating..." message</p>
                <p>5. Then you'll see "QR code not found" (expected, since this is just a test)</p>
                <p><strong>If you see these messages, the scanner is working!</strong></p>
            </div>
        </body>
        </html>
    `);
});

// Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Multer for photo uploads
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const photoDir = './public/photos';
        if (!fs.existsSync(photoDir)) {
            fs.mkdirSync(photoDir, { recursive: true });
        }
        cb(null, photoDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const uploadPhoto = multer({ 
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Initialize Supabase database
async function initializeDatabase() {
    try {
        await db.initializeTables();
        console.log('Supabase database connected successfully');
    } catch (error) {
        console.error('Supabase connection error:', error);
        console.log('Please ensure your Supabase database is set up properly');
        console.log('Run the SQL commands from setup-supabase.sql in your Supabase SQL Editor');
    }
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

// Upload Excel file and generate QR codes
app.post('/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let processedCount = 0;
        const results = [];

        for (const row of data) {
            // Extract data from Excel columns with more variations
            const name = row.Name || row.name || row.NAME || row['Name'] || row['name'] || 
                        row['NAME'] || row[' Name'] || row['Name '] || row[' Name '];
            
            const originalId = row.Ticket_ID || row.ticket_id || row.TICKET_ID || 
                              row['Ticket_ID'] || row['Ticket ID'] || row['ticket_id'] ||
                              row['TICKET_ID'] || row[' Ticket_ID'] || row['Ticket_ID '] ||
                              row[' Ticket_ID '] || row.TicketID || row.ticketid;
            
            const email = row.Email || row.email || row.EMAIL || row['Email'] || 
                         row['email'] || row['EMAIL'] || row[' Email'] || row['Email '] ||
                         row[' Email '];

            if (!name || !originalId) {
                continue; // Skip rows without required data
            }

            // Generate unique token
            const qrToken = uuidv4();
            
            // Create QR code data
            const qrData = JSON.stringify({
                token: qrToken,
                name: name,
                ticketId: originalId,
                email: email,
                event: 'QR MUN Event'
            });

            try {
                // Generate QR code as PNG buffer
                const qrCodeBuffer = await QRCode.toBuffer(qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Generate unique filename for the QR code using email
                const cleanEmail = email.replace(/[^a-zA-Z0-9@\.\-_]/g, '').replace(/[@\.]/g, '_');
                const qrFileName = `${cleanEmail}_${qrToken.substring(0, 8)}.png`;
                
                // Upload QR code to Supabase Storage
                const qrCodeUrl = await db.uploadQRCode(qrCodeBuffer, qrFileName);

                // Insert into Supabase database
                const attendee = {
                    name: name,
                    attendee_id: originalId,
                    email: email,
                    token: qrToken,
                    qr_code: qrCodeUrl,  // Store the Supabase Storage URL
                    scanned: false
                };

                await db.insertAttendee(attendee);

                processedCount++;
                results.push({
                    name: name,
                    ticketId: originalId,
                    email: email,
                    qrToken: qrToken
                });

            } catch (qrError) {
                console.error(`Error generating QR for ${name}:`, qrError);
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Processed ${processedCount} attendees`,
            results: results
        });

    } catch (error) {
        console.error('Error processing Excel file:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

// Scanner page
app.get('/scanner', (req, res) => {
    res.render('scanner-jsqr');
});

// Test page
app.get('/test', (req, res) => {
    res.render('test');
});

// Validate QR code scan
app.post('/validate-qr', async (req, res) => {
    const { qrData } = req.body;
    const startTime = Date.now();

    try {
        // Try to parse QR data
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (parseError) {
            // If not JSON, assume it's plain text token
            parsedData = { token: qrData.trim() };
        }

        const token = parsedData.token;

        if (!token) {
            return res.json({ 
                success: false, 
                message: '❌ Invalid QR Code Format',
                details: 'QR code does not contain a valid token',
                responseTime: Date.now() - startTime
            });
        }

        try {
            // Check if QR code exists and hasn't been used
            const row = await db.getAttendeeByToken(token);

            if (!row) {
                return res.json({ 
                    success: false, 
                    message: '❌ QR Code Not Found',
                    details: 'This QR code is not registered in the system',
                    responseTime: Date.now() - startTime
                });
            }

            if (row.scanned) {
                const scanDate = new Date(row.scan_time);
                return res.json({ 
                    success: false, 
                    message: '⚠️ Already Scanned',
                    details: `${row.name} was already checked in on ${scanDate.toLocaleDateString()} at ${scanDate.toLocaleTimeString()}`,
                    attendee: {
                        name: row.name,
                        ticketId: row.ticket_id,
                        scanTime: row.scan_time
                    },
                    responseTime: Date.now() - startTime
                });
            }

            // Mark as scanned
            await db.updateAttendeeByToken(token, { 
                scanned: true, 
                scan_time: new Date().toISOString() 
            });

            res.json({
                success: true,
                message: '✅ Welcome!',
                details: `Successfully checked in ${row.name}`,
                attendee: {
                    name: row.name,
                    ticketId: row.ticket_id,
                    email: row.email,
                    scanTime: new Date().toISOString()
                },
                responseTime: Date.now() - startTime
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ 
                success: false, 
                message: '❌ System Error',
                details: 'Database connection failed',
                responseTime: Date.now() - startTime
            });
        }

    } catch (error) {
        console.error('Error parsing QR data:', error);
        res.json({ 
            success: false, 
            message: '❌ Invalid QR Code Format',
            details: 'Could not parse QR code data',
            responseTime: Date.now() - startTime
        });
    }
});

// Search attendee endpoint
app.post('/search-attendee', async (req, res) => {
    const { name, ticketId } = req.body;
    
    if (!name && !ticketId) {
        return res.json({ success: false, message: 'Please provide name or ticket ID' });
    }
    
    try {
        const attendees = await db.searchAttendees(name, ticketId);
        
        if (attendees.length === 0) {
            return res.json({ success: false, message: 'No attendee found' });
        }
        
        const attendee = attendees[0]; // Get first match
        res.json({
            success: true,
            attendee: {
                id: attendee.id,
                name: attendee.name,
                ticketId: attendee.attendee_id,
                email: attendee.email,
                isScanned: attendee.scanned,
                scanTime: attendee.scan_time,
                qrToken: attendee.token
            }
        });
        
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Bulk actions
app.post('/admin/bulk-reset', requireAuth, async (req, res) => {
    try {
        await db.resetAllScans();
        res.json({ success: true, message: 'All scan statuses reset successfully' });
    } catch (error) {
        console.error('Error resetting scans:', error);
        res.status(500).json({ success: false, message: 'Error resetting scan statuses' });
    }
});

// Admin dashboard
app.get('/admin', (req, res) => {
    // Simply render the admin page - authentication will be handled by JavaScript
    res.render('admin-simple');
});

// Get attendees for scanner (protected)
app.get('/admin/attendees', requireAuth, async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        res.json(attendees);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Update attendee (protected)
app.put('/admin/attendees/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, attendee_id, email, scanned, scan_time } = req.body;
    
    try {
        // If updating scan status
        if (scanned !== undefined) {
            const scanTimeValue = scanned ? (scan_time || new Date().toISOString()) : null;
            
            const updatedAttendee = await db.updateAttendee(id, {
                scanned: scanned,
                scan_time: scanTimeValue
            });
            
            if (!updatedAttendee) {
                return res.status(404).json({ error: 'Attendee not found' });
            }
            
            return res.json({ success: true, message: 'Scan status updated successfully' });
        }
        
        // If updating attendee info
        if (!name || !attendee_id) {
            return res.status(400).json({ error: 'Name and Attendee ID are required' });
        }
        
        const updatedAttendee = await db.updateAttendee(id, {
            name: name,
            attendee_id: attendee_id,
            email: email
        });
        
        if (!updatedAttendee) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        res.json({ success: true, message: 'Attendee updated successfully' });
        
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update attendee: ' + error.message });
    }
});

// Delete attendee (protected)
app.delete('/admin/attendees/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const deleted = await db.deleteAttendee(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        res.json({ success: true, message: 'Attendee deleted successfully' });
        
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete attendee: ' + error.message });
    }
});

// Reset all scan status (protected)
app.post('/admin/reset-scans', requireAuth, async (req, res) => {
    try {
        await db.resetAllScans();
        res.json({ 
            success: true, 
            message: 'Reset scan status for all attendees' 
        });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ error: 'Failed to reset scan status: ' + error.message });
    }
});

// Clear all data (protected)
app.post('/admin/clear-all', requireAuth, async (req, res) => {
    try {
        await db.clearAllAttendees();
        res.json({ 
            success: true, 
            message: 'Cleared all attendees and QR codes' 
        });
    } catch (error) {
        console.error('Clear error:', error);
        res.status(500).json({ error: 'Failed to clear data: ' + error.message });
    }
});

// Bulk download QR codes as ZIP
app.get('/download/qr-codes', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        
        if (attendees.length === 0) {
            return res.status(404).json({ error: 'No attendees found' });
        }
        
        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="qr-codes-${new Date().toISOString().split('T')[0]}.zip"`);
        
        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        // Handle errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create ZIP archive' });
        });
        
        // Pipe archive to response
        archive.pipe(res);
        
        // Add QR codes to archive
        for (const attendee of attendees) {
            if (attendee.qr_code) {
                try {
                    // Fetch QR code from Supabase Storage URL
                    const response = await fetch(attendee.qr_code);
                    const buffer = await response.buffer();
                    
                    // Use email as the primary identifier for filename
                    const email = attendee.email || 'no_email';
                    const cleanEmail = email.replace(/[^a-zA-Z0-9@\.\-_]/g, '').replace(/[@\.]/g, '_');
                    const cleanName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const filename = `${cleanEmail}_${cleanName}.png`;
                    
                    archive.append(buffer, { name: filename });
                } catch (fetchError) {
                    console.error(`Error fetching QR code for ${attendee.name}:`, fetchError);
                    // Continue with next attendee if one fails
                }
            }
        }
        
        // Finalize archive
        archive.finalize();
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download QR codes: ' + error.message });
    }
});

// Upload photo for attendee
app.post('/upload-photo/:id', uploadPhoto.single('photo'), async (req, res) => {
    const attendeeId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }

    const photoPath = `photos/${req.file.filename}`;
    
    try {
        const updatedAttendee = await db.updateAttendee(attendeeId, { photo_path: photoPath });
        
        if (!updatedAttendee) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            photoPath: photoPath
        });
        
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({ error: 'Error updating photo: ' + error.message });
    }
});

// Camera capture page
app.get('/camera/:id', async (req, res) => {
    const attendeeId = req.params.id;
    
    try {
        const attendees = await db.getAllAttendees();
        const attendee = attendees.find(a => a.id == attendeeId);
        
        if (!attendee) {
            return res.status(404).send('Attendee not found');
        }
        
        res.render('camera', { attendee });
        
    } catch (error) {
        console.error('Error fetching attendee:', error);
        res.status(500).send('Database error');
    }
});

// Download all QR codes as ZIP
app.get('/download-qr-codes', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        const attendeesWithQR = attendees.filter(a => a.qr_code);
        
        if (attendeesWithQR.length === 0) {
            return res.status(404).send('No QR codes found');
        }
        
        const zipPath = path.join(__dirname, 'qr-codes-export.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipPath, 'qr-codes-export.zip', (err) => {
                if (!err) {
                    fs.unlinkSync(zipPath); // Clean up the zip file after download
                }
            });
        });

        archive.on('error', (err) => {
            res.status(500).send('Error creating zip file');
        });

        archive.pipe(output);

        for (const attendee of attendeesWithQR) {
            if (attendee.qr_code) {
                try {
                    // Fetch QR code from Supabase Storage URL
                    const response = await fetch(attendee.qr_code);
                    const buffer = await response.buffer();
                    
                    // Use email as the primary identifier for filename
                    const email = attendee.email || 'no_email';
                    const cleanEmail = email.replace(/[^a-zA-Z0-9@\.\-_]/g, '').replace(/[@\.]/g, '_');
                    const cleanName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const filename = `${cleanEmail}_${cleanName}.png`;
                    
                    archive.append(buffer, { name: filename });
                } catch (fetchError) {
                    console.error(`Error fetching QR code for ${attendee.name}:`, fetchError);
                    // Continue with next attendee if one fails
                }
            }
        }

        archive.finalize();
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).send('Database error');
    }
});

// Export QR codes with attendee info for emailing
app.get('/export-for-email', async (req, res) => {
    try {
        const attendees = await db.getAllAttendees();
        const attendeesWithQR = attendees.filter(a => a.qr_code);

        const emailData = attendeesWithQR.map(attendee => ({
            name: attendee.name,
            email: attendee.email,
            ticketId: attendee.attendee_id,
            qrCodeData: attendee.qr_code,
            photoPath: attendee.photo_path || null
        }));

        res.json({
            success: true,
            message: `Found ${emailData.length} attendees with QR codes`,
            attendees: emailData
        });
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Search function for Supabase
if (!db.searchAttendees) {
    db.searchAttendees = async (name, ticketId) => {
        const attendees = await db.getAllAttendees();
        return attendees.filter(attendee => {
            const nameMatch = !name || attendee.name.toLowerCase().includes(name.toLowerCase());
            const idMatch = !ticketId || attendee.attendee_id === ticketId;
            return nameMatch && idMatch;
        });
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`QR Event System running on http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Scanner: http://localhost:${PORT}/scanner`);
});

module.exports = app;
