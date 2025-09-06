// Ultra-simple Vercel API - No dependencies, just basic functionality
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Basic health check
        if (req.url === '/api/working' || req.url === '/working') {
            return res.status(200).json({
                status: 'working',
                message: 'Ultra-simple API is functional',
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url
            });
        }

        // Environment check
        if (req.url === '/api/env-check' || req.url === '/env-check') {
            return res.status(200).json({
                status: 'env-check',
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
                nodeEnv: process.env.NODE_ENV || 'not-set',
                timestamp: new Date().toISOString()
            });
        }

        // Database test
        if (req.url === '/api/db-test' || req.url === '/db-test') {
            if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
                return res.status(500).json({
                    error: 'Missing environment variables',
                    hasUrl: !!process.env.SUPABASE_URL,
                    hasKey: !!process.env.SUPABASE_ANON_KEY
                });
            }

            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            
            try {
                const { data, error } = await supabase
                    .from('attendees')
                    .select('count(*)')
                    .limit(1);

                return res.status(200).json({
                    status: 'database-connected',
                    success: !error,
                    error: error?.message || null,
                    timestamp: new Date().toISOString()
                });
            } catch (dbError) {
                return res.status(500).json({
                    status: 'database-error',
                    error: dbError.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Default response
        return res.status(200).json({
            status: 'ok',
            message: 'Ultra-simple API endpoints',
            endpoints: [
                '/api/working - Basic functionality test',
                '/api/env-check - Environment variables check',
                '/api/db-test - Database connection test'
            ],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ultra-simple API error:', error);
        return res.status(500).json({
            error: 'API Error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
};
