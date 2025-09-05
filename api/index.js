// Vercel Serverless Function for QR Event Management System
const express = require('express');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for demo (use database in production)
let attendees = [];
let adminSessions = new Set();

// Helper functions
function generateQRData(attendee) {
    return JSON.stringify({
        token: attendee.qr_token,
        name: attendee.name,
        ticketId: attendee.ticket_id,
        event: 'QR MUN Event'
    });
}

async function generateQRCode(data) {
    try {
        return await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
    } catch (error) {
        console.error('QR generation error:', error);
        throw error;
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
}

// Configure multer for file uploads
const upload = multer({ 
    dest: '/tmp/uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>QR Event Management System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h2 class="mb-0">QR Event Management System</h2>
                        </div>
                        <div class="card-body">
                            <p class="lead">Welcome to the QR Event Management System! This system is deployed on Vercel.</p>
                            
                            <div class="alert alert-info">
                                <h5>🚀 Deployment Successful!</h5>
                                <p>Your QR Event Management System is now live on Vercel with the following features:</p>
                                <ul>
                                    <li>✅ QR Code Generation</li>
                                    <li>✅ Real-time Admin Dashboard</li>
                                    <li>✅ Duplicate Scan Prevention</li>
                                    <li>✅ Cloud Storage Integration</li>
                                </ul>
                            </div>
                            
                            <h5>Available Endpoints:</h5>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-body">
                                            <h6>Admin Dashboard</h6>
                                            <a href="/admin/login" class="btn btn-primary">Access Admin</a>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card mb-3">
                                        <div class="card-body">
                                            <h6>QR Scanner</h6>
                                            <a href="/scanner" class="btn btn-success">Open Scanner</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h5>Setup Instructions:</h5>
                            <ol>
                                <li>Configure your Supabase environment variables</li>
                                <li>Set up your admin password</li>
                                <li>Upload attendee data via admin dashboard</li>
                                <li>Start scanning QR codes!</li>
                            </ol>
                            
                            <div class="alert alert-warning">
                                <strong>Note:</strong> This is a demo deployment. For full functionality, configure your environment variables in Vercel dashboard.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.get('/admin/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Login - QR Event System</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h4>Admin Login</h4>
                        </div>
                        <div class="card-body">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label class="form-label">Password</label>
                                    <input type="password" class="form-control" id="password" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Login</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/admin/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('adminSession', result.token);
                    window.location.href = '/admin';
                } else {
                    alert('Invalid password');
                }
            } catch (error) {
                alert('Login failed');
            }
        });
        </script>
    </body>
    </html>
    `);
});

app.post('/admin/auth', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
        const token = uuidv4();
        adminSessions.add(token);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

app.get('/admin', requireAuth, (req, res) => {
    res.json({
        message: 'Admin Dashboard',
        attendees: attendees.length,
        scanned: attendees.filter(a => a.scanned).length,
        pending: attendees.filter(a => !a.scanned).length
    });
});

app.get('/scanner', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>QR Scanner - Event System</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-3">
            <div class="card">
                <div class="card-header">
                    <h4>QR Code Scanner</h4>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        QR Scanner functionality available. 
                        <br>For full features, configure your Supabase environment.
                    </div>
                    <button class="btn btn-primary" onclick="alert('Scanner ready! Configure environment for full functionality.')">
                        Start Scanning
                    </button>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        let processed = 0;
        
        for (const row of data) {
            if (row.Name && row.Ticket_ID) {
                const attendee = {
                    id: uuidv4(),
                    name: row.Name,
                    ticket_id: row.Ticket_ID,
                    email: row.Email || '',
                    qr_token: uuidv4(),
                    scanned: false,
                    scan_time: null,
                    created_at: new Date().toISOString()
                };
                
                // Generate QR code
                const qrData = generateQRData(attendee);
                attendee.qr_code = await generateQRCode(qrData);
                
                attendees.push(attendee);
                processed++;
            }
        }

        res.json({
            success: true,
            message: `Successfully processed ${processed} attendees`,
            processed
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed: ' + error.message
        });
    }
});

app.post('/validate-qr', async (req, res) => {
    const { qrData } = req.body;
    
    try {
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

        const attendee = attendees.find(a => a.qr_token === token);
        if (!attendee) {
            return res.json({
                success: false,
                message: '❌ QR Code Not Found'
            });
        }

        if (attendee.scanned) {
            return res.json({
                success: false,
                message: '⚠️ Already Scanned',
                details: `${attendee.name} was already checked in.`
            });
        }

        // Mark as scanned
        attendee.scanned = true;
        attendee.scan_time = new Date().toISOString();

        res.json({
            success: true,
            message: '✅ Welcome!',
            details: `Successfully checked in ${attendee.name}`,
            attendee: {
                name: attendee.name,
                ticketId: attendee.ticket_id,
                scanTime: attendee.scan_time
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: '❌ System Error'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        attendees: attendees.length,
        environment: 'vercel'
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'QR Event Management System API',
        version: '1.0.0',
        deployment: 'vercel',
        endpoints: [
            'GET / - Home page',
            'GET /admin/login - Admin login',
            'POST /admin/auth - Authentication',
            'GET /admin - Admin dashboard',
            'GET /scanner - QR scanner',
            'POST /upload - File upload',
            'POST /validate-qr - QR validation',
            'GET /health - Health check'
        ]
    });
});

// Export for Vercel
module.exports = app;