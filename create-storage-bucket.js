const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createQRCodeBucket() {
    try {
        console.log('Creating QR codes storage bucket...');
        
        // Create bucket if it doesn't exist
        const { data, error } = await supabase.storage.createBucket('qr-codes', {
            public: true,
            allowedMimeTypes: ['image/png']
        });

        if (error) {
            if (error.message.includes('already exists')) {
                console.log('Bucket "qr-codes" already exists');
            } else {
                console.error('Error creating bucket:', error);
                return;
            }
        } else {
            console.log('Bucket created successfully:', data);
        }

        // List existing buckets to verify
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
            console.error('Error listing buckets:', listError);
        } else {
            console.log('Available buckets:', buckets.map(b => b.name));
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

createQRCodeBucket();
