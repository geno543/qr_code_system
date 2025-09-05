const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();

// Admin credentials
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'genoo';

// In-memory storage for Vercel
let attendees = [];
let activeSessions = new Map();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS for Vercel
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Authentication functions
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

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        attendees: attendees.length,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload Excel file
app.post('/api/upload', upload.single('excelFile'), (req, res) => {
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
app.get('/api/admin/attendees', requireAuth, (req, res) => {
    try {
        const stats = {
            total: attendees.length,
            scanned: attendees.filter(a => a.is_scanned).length,
            pending: attendees.filter(a => !a.is_scanned).length
        };
        
        res.json({
            attendees: attendees,
            stats: stats
        });
    } catch (error) {
        console.error('Get attendees error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Validate QR code
app.post('/api/validate-qr', (req, res) => {
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

// Simple HTML responses for main routes
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Event Management</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .btn { display: inline-block; padding: 10px 20px; margin: 10px; text-decoration: none; background: #007bff; color: white; border-radius: 5px; }
                .btn:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <h1>QR Event Management System</h1>
            <p>Welcome to the QR Code Event Management System. Choose an option below:</p>
            <a href="/admin" class="btn">Admin Dashboard</a>
            <a href="/scanner" class="btn">QR Scanner</a>
            <a href="/api/health" class="btn">Health Check</a>
        </body>
        </html>
    `);
});

app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .form-group { margin: 10px 0; }
                input, button { padding: 10px; margin: 5px; }
                button { background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #0056b3; }
                #result { margin: 20px 0; padding: 10px; border-radius: 5px; }
                .success { background: #d4edda; color: #155724; }
                .error { background: #f8d7da; color: #721c24; }
            </style>
        </head>
        <body>
            <h1>Admin Dashboard</h1>
            <div class="form-group">
                <h3>Login</h3>
                <input type="password" id="password" placeholder="Password" />
                <button onclick="login()">Login</button>
            </div>
            <div id="result"></div>
            
            <script>
                function login() {
                    const password = document.getElementById('password').value;
                    fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    })
                    .then(r => r.json())
                    .then(data => {
                        const result = document.getElementById('result');
                        if (data.success) {
                            result.className = 'success';
                            result.innerHTML = 'Login successful! Token: ' + data.token.substring(0, 10) + '...';
                            localStorage.setItem('adminToken', data.token);
                        } else {
                            result.className = 'error';
                            result.innerHTML = 'Login failed: ' + data.message;
                        }
                    })
                    .catch(err => {
                        document.getElementById('result').innerHTML = 'Error: ' + err.message;
                    });
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/scanner', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Scanner</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                #result { margin: 20px 0; padding: 10px; border-radius: 5px; min-height: 50px; }
                .success { background: #d4edda; color: #155724; }
                .error { background: #f8d7da; color: #721c24; }
                .warning { background: #fff3cd; color: #856404; }
                input, button { padding: 10px; margin: 5px; width: 200px; }
                button { background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <h1>QR Code Scanner</h1>
            <div>
                <input type="text" id="qrInput" placeholder="Enter QR code data" />
                <button onclick="validateQR()">Validate QR</button>
            </div>
            <div id="result"></div>
            
            <script>
                function validateQR() {
                    const qrData = document.getElementById('qrInput').value;
                    if (!qrData) {
                        document.getElementById('result').innerHTML = 'Please enter QR code data';
                        return;
                    }
                    
                    fetch('/api/validate-qr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ qrData })
                    })
                    .then(r => r.json())
                    .then(data => {
                        const result = document.getElementById('result');
                        result.innerHTML = data.message;
                        
                        if (data.type === 'success') {
                            result.className = 'success';
                        } else if (data.type === 'duplicate') {
                            result.className = 'warning';
                        } else {
                            result.className = 'error';
                        }
                        
                        document.getElementById('qrInput').value = '';
                    })
                    .catch(err => {
                        document.getElementById('result').innerHTML = 'Error: ' + err.message;
                        document.getElementById('result').className = 'error';
                    });
                }
                
                document.getElementById('qrInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        validateQR();
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Export CSV
app.get('/api/export/csv', requireAuth, (req, res) => {
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
        console.error('Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Not found:', req.method, req.url);
    res.status(404).json({ 
        error: 'Not found',
        path: req.url,
        method: req.method
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`QR Event System (API) running on http://localhost:${port}`);
        console.log(`Health check: http://localhost:${port}/api/health`);
    });
}

module.exports = app;
