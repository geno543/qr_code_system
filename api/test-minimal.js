// Minimal test API for debugging Vercel deployment
module.exports = (req, res) => {
    try {
        console.log('Basic API test called');
        
        // Test environment variables
        const envTest = {
            hasSupabaseUrl: !!process.env.SUPABASE_URL,
            hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
            nodeEnv: process.env.NODE_ENV || 'not-set'
        };
        
        res.status(200).json({
            message: 'Minimal API working',
            timestamp: new Date().toISOString(),
            environment: envTest
        });
    } catch (error) {
        console.error('Minimal API error:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
};
