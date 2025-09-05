console.log('🔍 Starting server debug...');

try {
    console.log('1. Loading dotenv...');
    require('dotenv').config();
    
    console.log('2. Environment variables:');
    console.log('   - SUPABASE_URL:', process.env.SUPABASE_URL ? 'loaded' : 'missing');
    console.log('   - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'loaded' : 'missing');
    console.log('   - ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'loaded' : 'missing');
    
    console.log('3. Loading Supabase...');
    const { createClient } = require('@supabase/supabase-js');
    
    console.log('4. Loading database module...');
    const db = require('./supabase-db');
    
    console.log('5. Loading Express...');
    const express = require('express');
    const app = express();
    
    console.log('6. Setting up basic route...');
    app.get('/', (req, res) => {
        res.send('Server is working!');
    });
    
    console.log('7. Starting server...');
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log('🎉 All systems working!');
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📍 Stack trace:');
    console.error(error.stack);
}
