// Simplified Vercel API with better error handling
const express = require('express');
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Initialize database lazily
let db = null;
let dbInitialized = false;

async function getDatabase() {
    if (dbInitialized && db) {
        return db;
    }

    try {
        console.log('Initializing database...');
        
        // Check environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error(`Missing env vars - URL: ${!!process.env.SUPABASE_URL}, Key: ${!!process.env.SUPABASE_ANON_KEY}`);
        }

        // Import and initialize database
        const Database = require('../supabase-db');
        db = new Database();
        dbInitialized = true;
        
        console.log('✅ Database initialized successfully');
        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
                hasAdminPassword: !!process.env.ADMIN_PASSWORD
            },
            database: {
                initialized: dbInitialized,
                connection: 'testing...'
            }
        };

        // Test database connection
        try {
            const database = await getDatabase();
            health.database.connection = 'successful';
        } catch (dbError) {
            health.database.connection = 'failed';
            health.database.error = dbError.message;
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            error: 'Health check failed',
            message: error.message
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        envVars: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
            urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) : 'missing',
            keyPrefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) : 'missing'
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'QR Event Management System API',
        status: 'running',
        endpoints: [
            '/api/health',
            '/api/test'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});

module.exports = app;
