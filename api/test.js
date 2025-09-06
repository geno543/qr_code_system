// Vercel Serverless API - QR Event Management System
const express = require('express');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'QR Event System API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working correctly',
        environment: {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'QR Event Management System',
        status: 'running',
        endpoints: [
            '/api/health',
            '/api/test'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        message: 'The requested endpoint does not exist'
    });
});

// Export for Vercel
module.exports = app;
