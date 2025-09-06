// Simplified main API - bypass complex initialization
const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function initSupabase() {
    if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    return supabase;
}

module.exports = async (req, res) => {
    try {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Initialize Supabase
        const db = initSupabase();

        // Health endpoint
        if (req.url === '/api/health') {
            return res.status(200).json({
                status: 'healthy',
                database: !!db,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                version: '2.0-simplified'
            });
        }

        // Get attendees
        if (req.url === '/api/attendees' && req.method === 'GET') {
            if (!db) {
                return res.status(500).json({ error: 'Database not initialized' });
            }

            const { data, error } = await db
                .from('attendees')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({
                attendees: data || [],
                count: (data || []).length,
                timestamp: new Date().toISOString()
            });
        }

        // Scan QR code
        if (req.url.startsWith('/api/scan/') && req.method === 'POST') {
            if (!db) {
                return res.status(500).json({ error: 'Database not initialized' });
            }

            const token = req.url.split('/api/scan/')[1];
            
            if (!token) {
                return res.status(400).json({ error: 'Missing token' });
            }

            // Get attendee by token
            const { data: attendee, error: findError } = await db
                .from('attendees')
                .select('*')
                .eq('qr_token', token)
                .single();

            if (findError || !attendee) {
                return res.status(404).json({ error: 'Attendee not found' });
            }

            if (attendee.is_scanned) {
                return res.status(400).json({ 
                    error: 'Already scanned',
                    scanTime: attendee.scan_time
                });
            }

            // Update scan status
            const { data: updated, error: updateError } = await db
                .from('attendees')
                .update({ 
                    is_scanned: true, 
                    scan_time: new Date().toISOString() 
                })
                .eq('qr_token', token)
                .select()
                .single();

            if (updateError) {
                return res.status(500).json({ error: updateError.message });
            }

            return res.status(200).json({
                success: true,
                attendee: updated,
                message: 'Scan successful'
            });
        }

        // Default response
        return res.status(200).json({
            message: 'QR Event Management API - Simplified',
            endpoints: [
                'GET /api/health - Health check',
                'GET /api/attendees - Get all attendees',
                'POST /api/scan/{token} - Scan QR code'
            ],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Simplified API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
