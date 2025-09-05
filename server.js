const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (change these for production!)
const ADMIN_PASSWORD = 'genoo';

// Store active sessions (in production, use Redis or database)
const activeSessions = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/qr', express.static(path.join(__dirname, 'public/qr')));
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

// Initialize SQLite database
const db = new sqlite3.Database('event.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ticket_id TEXT NOT NULL,
        email TEXT,
        qr_token TEXT UNIQUE NOT NULL,
        qr_code_path TEXT,
        photo_path TEXT,
        is_scanned BOOLEAN DEFAULT 0,
        scan_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

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

        // Create QR codes directory if it doesn't exist
        const qrDir = './public/qr/qr-codes';
        if (!fs.existsSync('./public/qr')) {
            fs.mkdirSync('./public/qr', { recursive: true });
        }
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }

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

            // Generate QR code
            const qrPath = `qr-codes/${qrToken}.png`;
            const fullQrPath = `./public/qr/${qrPath}`;
            
            try {
                await QRCode.toFile(fullQrPath, qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Insert into database
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO attendees (name, ticket_id, email, qr_token, qr_code_path) VALUES (?, ?, ?, ?, ?)`,
                        [name, originalId, email, qrToken, qrPath],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });

                processedCount++;
                results.push({
                    name: name,
                    ticketId: originalId,
                    email: email,
                    qrToken: qrToken,
                    qrPath: qrPath
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
app.post('/validate-qr', (req, res) => {
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

        // Check if QR code exists and hasn't been used
        db.get(
            `SELECT * FROM attendees WHERE qr_token = ?`,
            [token],
            (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: '❌ System Error',
                        details: 'Database connection failed',
                        responseTime: Date.now() - startTime
                    });
                }

                if (!row) {
                    return res.json({ 
                        success: false, 
                        message: '❌ QR Code Not Found',
                        details: 'This QR code is not registered in the system',
                        responseTime: Date.now() - startTime
                    });
                }

                if (row.is_scanned) {
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
                db.run(
                    `UPDATE attendees SET is_scanned = 1, scan_time = CURRENT_TIMESTAMP WHERE qr_token = ?`,
                    [token],
                    function(err) {
                        if (err) {
                            console.error('Error updating scan status:', err);
                            return res.status(500).json({ 
                                success: false, 
                                message: '❌ Update Failed',
                                details: 'Could not mark attendee as checked in',
                                responseTime: Date.now() - startTime
                            });
                        }

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
                    }
                );
            }
        );

    } catch (error) {
        console.error('Error parsing QR data:', error);
        res.json({ success: false, message: 'Invalid QR code format' });
    }
});

// Search attendee endpoint
app.post('/search-attendee', (req, res) => {
    const { name, ticketId } = req.body;
    
    let query = 'SELECT * FROM attendees WHERE ';
    let params = [];
    
    if (name && ticketId) {
        query += 'name LIKE ? AND ticket_id = ?';
        params = [`%${name}%`, ticketId];
    } else if (name) {
        query += 'name LIKE ?';
        params = [`%${name}%`];
    } else if (ticketId) {
        query += 'ticket_id = ?';
        params = [ticketId];
    } else {
        return res.json({ success: false, message: 'Please provide name or ticket ID' });
    }
    
    db.get(query, params, (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        if (!row) {
            return res.json({ success: false, message: 'Attendee not found' });
        }
        
        if (row.is_scanned) {
            return res.json({ 
                success: false, 
                message: 'Attendee already checked in',
                details: {
                    name: row.name,
                    scanTime: row.scan_time
                }
            });
        }
        
        // Mark as scanned
        db.run('UPDATE attendees SET is_scanned = 1, scan_time = CURRENT_TIMESTAMP WHERE id = ?', 
            [row.id], 
            (err) => {
                if (err) {
                    console.error('Error updating scan status:', err);
                    return res.json({ success: false, message: 'Error updating scan status' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Attendee checked in successfully',
                    attendee: { 
                        name: row.name, 
                        ticketId: row.ticket_id,
                        email: row.email,
                        scanTime: new Date().toISOString()
                    } 
                });
            }
        );
    });
});

// Admin dashboard
app.get('/admin', (req, res) => {
    // Simply render the admin page - authentication will be handled by JavaScript
    res.render('admin-simple');
});

// Get attendees for scanner (protected)
app.get('/admin/attendees', requireAuth, (req, res) => {
    db.all(`SELECT * FROM attendees ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Update attendee (protected)
app.put('/admin/attendees/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { name, ticket_id, email, is_scanned, scan_time } = req.body;
    
    // If updating scan status
    if (is_scanned !== undefined) {
        const scanTimeValue = is_scanned ? (scan_time || new Date().toISOString()) : null;
        
        db.run(
            `UPDATE attendees SET is_scanned = ?, scan_time = ? WHERE id = ?`,
            [is_scanned ? 1 : 0, scanTimeValue, id],
            function(err) {
                if (err) {
                    console.error('Update scan status error:', err);
                    return res.status(500).json({ error: 'Failed to update scan status' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Attendee not found' });
                }
                
                res.json({ success: true, message: 'Scan status updated successfully' });
            }
        );
        return;
    }
    
    // If updating attendee info
    if (!name || !ticket_id) {
        return res.status(400).json({ error: 'Name and Ticket ID are required' });
    }
    
    db.run(
        `UPDATE attendees SET name = ?, ticket_id = ?, email = ? WHERE id = ?`,
        [name, ticket_id, email, id],
        function(err) {
            if (err) {
                console.error('Update error:', err);
                return res.status(500).json({ error: 'Failed to update attendee' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Attendee not found' });
            }
            
            res.json({ success: true, message: 'Attendee updated successfully' });
        }
    );
});

// Delete attendee (protected)
app.delete('/admin/attendees/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    // First get the attendee info to delete QR file
    db.get('SELECT qr_code_path FROM attendees WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Delete from database
        db.run('DELETE FROM attendees WHERE id = ?', [id], function(deleteErr) {
            if (deleteErr) {
                console.error('Delete error:', deleteErr);
                return res.status(500).json({ error: 'Failed to delete attendee' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Attendee not found' });
            }
            
            // Try to delete QR code file
            if (row && row.qr_code_path) {
                const qrFilePath = path.join(__dirname, 'public', 'qr', row.qr_code_path);
                fs.unlink(qrFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.log('Could not delete QR file:', unlinkErr.message);
                    }
                });
            }
            
            res.json({ success: true, message: 'Attendee deleted successfully' });
        });
    });
});

// Reset all scan status (protected)
app.post('/admin/reset-scans', requireAuth, (req, res) => {
    db.run(
        'UPDATE attendees SET is_scanned = 0, scan_time = NULL',
        function(err) {
            if (err) {
                console.error('Reset error:', err);
                return res.status(500).json({ error: 'Failed to reset scan status' });
            }
            
            res.json({ 
                success: true, 
                message: `Reset scan status for ${this.changes} attendees` 
            });
        }
    );
});

// Clear all data (protected)
app.post('/admin/clear-all', requireAuth, (req, res) => {
    // Delete all QR files
    const qrDir = path.join(__dirname, 'public', 'qr');
    if (fs.existsSync(qrDir)) {
        fs.rmSync(qrDir, { recursive: true, force: true });
    }
    
    // Clear database
    db.run('DELETE FROM attendees', function(err) {
        if (err) {
            console.error('Clear error:', err);
            return res.status(500).json({ error: 'Failed to clear data' });
        }
        
        res.json({ 
            success: true, 
            message: `Cleared ${this.changes} attendees and all QR codes` 
        });
    });
});

// Bulk download QR codes as ZIP
app.get('/download/qr-codes', (req, res) => {
    const qrDir = path.join(__dirname, 'public', 'qr', 'qr-codes');
    
    // Check if QR codes directory exists
    if (!fs.existsSync(qrDir)) {
        return res.status(404).json({ error: 'No QR codes found' });
    }
    
    // Get all QR code files
    const files = fs.readdirSync(qrDir).filter(file => file.endsWith('.png'));
    
    if (files.length === 0) {
        return res.status(404).json({ error: 'No QR code images found' });
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
    
    // Add files to archive with attendee names
    db.all('SELECT name, ticket_id, qr_token FROM attendees', (err, attendees) => {
        if (err) {
            console.error('Database error:', err);
            // Add files with original names as fallback
            files.forEach(file => {
                const filePath = path.join(qrDir, file);
                archive.file(filePath, { name: file });
            });
        } else {
            // Add files with meaningful names
            files.forEach(file => {
                const filePath = path.join(qrDir, file);
                const token = file.replace('.png', '');
                const attendee = attendees.find(a => a.qr_token === token);
                
                if (attendee) {
                    // Clean name for filename
                    const cleanName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const fileName = `${attendee.ticket_id}_${cleanName}.png`;
                    archive.file(filePath, { name: fileName });
                } else {
                    archive.file(filePath, { name: file });
                }
            });
        }
        
        // Finalize the archive
        archive.finalize();
    });
});

// Upload photo for attendee
app.post('/upload-photo/:id', uploadPhoto.single('photo'), (req, res) => {
    const attendeeId = req.params.id;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }

    const photoPath = `photos/${req.file.filename}`;
    
    db.run(
        `UPDATE attendees SET photo_path = ? WHERE id = ?`,
        [photoPath, attendeeId],
        function(err) {
            if (err) {
                console.error('Error updating photo:', err);
                return res.status(500).json({ error: 'Error updating photo' });
            }
            
            res.json({
                success: true,
                message: 'Photo uploaded successfully',
                photoPath: photoPath
            });
        }
    );
});

// Camera capture page
app.get('/camera/:id', (req, res) => {
    const attendeeId = req.params.id;
    
    db.get(`SELECT * FROM attendees WHERE id = ?`, [attendeeId], (err, attendee) => {
        if (err || !attendee) {
            return res.status(404).send('Attendee not found');
        }
        res.render('camera', { attendee });
    });
});

// Download all QR codes as ZIP
app.get('/download-qr-codes', (req, res) => {
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

    db.all(`SELECT * FROM attendees WHERE qr_code_path IS NOT NULL`, (err, attendees) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        attendees.forEach(attendee => {
            const qrPath = path.join(__dirname, 'public', attendee.qr_code_path);
            if (fs.existsSync(qrPath)) {
                archive.file(qrPath, { name: `${attendee.name}_${attendee.ticket_id}.png` });
            }
        });

        archive.finalize();
    });
});

// Export QR codes with attendee info for emailing
app.get('/export-for-email', (req, res) => {
    db.all(`SELECT * FROM attendees WHERE qr_code_path IS NOT NULL`, (err, attendees) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const emailData = attendees.map(attendee => ({
            name: attendee.name,
            email: attendee.email,
            ticketId: attendee.ticket_id,
            qrCodePath: attendee.qr_code_path ? path.join(__dirname, 'public', attendee.qr_code_path) : null,
            photoPath: attendee.photo_path ? path.join(__dirname, 'public', attendee.photo_path) : null
        }));

        res.json({
            success: true,
            message: `Found ${emailData.length} attendees with QR codes`,
            attendees: emailData
        });
    });
});

// Download all QR codes as ZIP (optional feature)
app.get('/download-qr-codes-old', (req, res) => {
    // This would require additional implementation with archiver
    res.json({ message: 'Download feature coming soon' });
});

// Start server
app.listen(PORT, () => {
    console.log(`QR Event System running on http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Scanner: http://localhost:${PORT}/scanner`);
});

module.exports = app;
