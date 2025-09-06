// Simple diagnostic API for Vercel debugging
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'QR Event System - Diagnostic Mode',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Health check with detailed environment info
app.get('/api/health', (req, res) => {
    try {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
                hasAdminPassword: !!process.env.ADMIN_PASSWORD,
                supabaseUrlStart: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'missing',
                supabaseKeyStart: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'missing'
            },
            serverInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memoryUsage: process.memoryUsage()
            }
        };

        res.json(health);
    } catch (error) {
        res.status(500).json({
            error: 'Health check failed',
            message: error.message,
            stack: error.stack
        });
    }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        // Test if we can load the Supabase client
        const { createClient } = require('@supabase/supabase-js');
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return res.status(400).json({
                error: 'Missing environment variables',
                hasUrl: !!process.env.SUPABASE_URL,
                hasKey: !!process.env.SUPABASE_ANON_KEY
            });
        }

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        // Test a simple query
        const { data, error } = await supabase
            .from('attendees')
            .select('count(*)', { count: 'exact', head: true });

        if (error) {
            return res.status(500).json({
                error: 'Database query failed',
                details: error.message,
                code: error.code,
                hint: error.hint
            });
        }

        res.json({
            status: 'Database connection successful',
            timestamp: new Date().toISOString(),
            recordCount: data
        });

    } catch (error) {
        res.status(500).json({
            error: 'Database test failed',
            message: error.message,
            type: error.constructor.name
        });
    }
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
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
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
