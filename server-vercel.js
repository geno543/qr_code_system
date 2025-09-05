const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Admin credentials
const ADMIN_PASSWORD = 'genoo';

// In-memory storage for Vercel (replace with cloud DB for production)
let attendees = [];
let activeSessions = new Map();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
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
    
    session.expires = Date.now() + (24 * 60 * 60 * 1000);
    req.user = session.user;
    next();
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Configure multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/scanner', (req, res) => {
    res.render('scanner-jsqr');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/admin', (req, res) => {
    res.render('admin-simple');
});

// Admin login
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid password' 
        });
    }
    
    const token = generateToken();
    const expires = Date.now() + (24 * 60 * 60 * 1000);
    
    activeSessions.set(token, {
        user: 'admin',
        expires: expires
    });
    
    res.json({ 
        success: true, 
        token: token,
        message: 'Login successful'
    });
});

// Upload Excel file
app.post('/upload', upload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let workbook;
        if (req.file.originalname.endsWith('.csv')) {
            const csvData = req.file.buffer.toString();
            workbook = xlsx.read(csvData, { type: 'string' });
        } else {
            workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        }

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let addedCount = 0;
        const errors = [];

        for (const row of data) {
            const name = row.Name || row.name || row.NAME;
            const ticketId = row.Ticket_ID || row['Ticket ID'] || row.ticket_id || row.ID || row.id;
            const email = row.Email || row.email || row.EMAIL || '';

            if (!name || !ticketId) {
                errors.push(`Row missing name or ticket ID: ${JSON.stringify(row)}`);
                continue;
            }

            // Check for duplicates
            const exists = attendees.find(a => a.ticket_id === ticketId.toString());
            if (exists) {
                errors.push(`Duplicate ticket ID: ${ticketId}`);
                continue;
            }

            const qrToken = uuidv4();
            const attendee = {
                id: attendees.length + 1,
                name: name.toString(),
                ticket_id: ticketId.toString(),
                email: email.toString(),
                qr_token: qrToken,
                is_scanned: 0,
                scan_time: null,
                created_at: new Date().toISOString()
            };

            attendees.push(attendee);
            addedCount++;
        }

        res.json({
            success: true,
            message: `Successfully added ${addedCount} attendees`,
            errors: errors.length > 0 ? errors : undefined,
            count: addedCount
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// Get all attendees
app.get('/admin/attendees', requireAuth, (req, res) => {
    const stats = {
        total: attendees.length,
        scanned: attendees.filter(a => a.is_scanned).length,
        pending: attendees.filter(a => !a.is_scanned).length
    };
    
    res.json({
        attendees: attendees,
        stats: stats
    });
});

// Validate QR code
app.post('/validate-qr', (req, res) => {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.json({
                success: false,
                message: "❌ No QR data provided",
                type: 'error'
            });
        }

        const attendee = attendees.find(a => a.qr_token === qrData);
        
        if (!attendee) {
            return res.json({
                success: false,
                message: "❌ Invalid QR code",
                type: 'error'
            });
        }

        if (attendee.is_scanned) {
            return res.json({
                success: false,
                message: `⚠️ Already scanned by ${attendee.name}`,
                type: 'duplicate',
                attendee: {
                    name: attendee.name,
                    ticket_id: attendee.ticket_id,
                    scan_time: attendee.scan_time
                }
            });
        }

        // Mark as scanned
        attendee.is_scanned = 1;
        attendee.scan_time = new Date().toISOString();

        res.json({
            success: true,
            message: `✅ Welcome ${attendee.name}!`,
            type: 'success',
            attendee: {
                name: attendee.name,
                ticket_id: attendee.ticket_id,
                scan_time: attendee.scan_time
            }
        });

    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            message: "❌ System error occurred",
            type: 'error'
        });
    }
});

// Update attendee
app.put('/admin/attendees/:id', requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, ticket_id, email, is_scanned } = req.body;
        
        const attendeeIndex = attendees.findIndex(a => a.id === id);
        if (attendeeIndex === -1) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        attendees[attendeeIndex] = {
            ...attendees[attendeeIndex],
            name: name || attendees[attendeeIndex].name,
            ticket_id: ticket_id || attendees[attendeeIndex].ticket_id,
            email: email || attendees[attendeeIndex].email,
            is_scanned: is_scanned !== undefined ? is_scanned : attendees[attendeeIndex].is_scanned
        };
        
        res.json({ success: true, attendee: attendees[attendeeIndex] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete attendee
app.delete('/admin/attendees/:id', requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const attendeeIndex = attendees.findIndex(a => a.id === id);
        
        if (attendeeIndex === -1) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        attendees.splice(attendeeIndex, 1);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset all scans
app.post('/admin/reset-scans', requireAuth, (req, res) => {
    try {
        attendees.forEach(attendee => {
            attendee.is_scanned = 0;
            attendee.scan_time = null;
        });
        
        res.json({ 
            success: true, 
            message: 'All scan statuses reset successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear all data
app.post('/admin/clear-all', requireAuth, (req, res) => {
    try {
        attendees = [];
        res.json({ 
            success: true, 
            message: 'All data cleared successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export CSV
app.get('/export/csv', requireAuth, (req, res) => {
    try {
        const csvData = [
            'Name,Ticket ID,Email,Scanned,Scan Time',
            ...attendees.map(a => 
                `"${a.name}","${a.ticket_id}","${a.email}","${a.is_scanned ? 'Yes' : 'No'}","${a.scan_time || ''}"`
            )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="attendees.csv"');
        res.send(csvData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        attendees: attendees.length,
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// For Vercel
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`QR Event System running on http://localhost:${port}`);
        console.log(`Admin dashboard: http://localhost:${port}/admin`);
        console.log(`Scanner: http://localhost:${port}/scanner`);
    });
}

module.exports = app;
