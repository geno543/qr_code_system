const db = require('./supabase-db');

async function checkDatabase() {
    try {
        console.log('🔍 Checking Supabase database schema...\n');
        
        // Try to get existing attendees to see what columns exist
        const { data, error } = await db.supabase
            .from('attendees')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Database error:', error.message);
            if (error.message.includes('relation "attendees" does not exist')) {
                console.log('\n🔧 SOLUTION: Run the setup-supabase.sql script in your Supabase dashboard!');
            }
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ Database connected! Found attendees.');
            console.log('📋 Available columns:', Object.keys(data[0]));
        } else {
            console.log('✅ Database connected! No attendees yet, but table exists.');
            
            // Try to get table schema
            const { data: schemaData, error: schemaError } = await db.supabase
                .rpc('get_table_columns', { table_name: 'attendees' });
            
            if (!schemaError && schemaData) {
                console.log('📋 Table schema:', schemaData);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDatabase();
