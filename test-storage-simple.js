require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testStorage() {
    console.log('Testing Supabase Storage...');
    
    try {
        // Test 1: List buckets
        console.log('\n1. Listing buckets...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.log('❌ Buckets error:', bucketsError.message);
            return;
        }
        console.log('✅ Available buckets:', buckets.map(b => `${b.name} (public: ${b.public})`));
        
        // Test 2: Create bucket if needed
        if (!buckets.find(b => b.name === 'qr-codes')) {
            console.log('\n2. Creating qr-codes bucket...');
            const { data, error } = await supabase.storage.createBucket('qr-codes', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg']
            });
            if (error) {
                console.log('❌ Create bucket error:', error.message);
            } else {
                console.log('✅ Bucket created successfully');
            }
        } else {
            console.log('\n2. ✅ qr-codes bucket already exists');
        }
        
        // Test 3: Upload test file
        console.log('\n3. Testing file upload...');
        const testData = Buffer.from('test QR code data');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('qr-codes')
            .upload('test-qr.png', testData, {
                contentType: 'image/png',
                upsert: true
            });
        
        if (uploadError) {
            console.log('❌ Upload error:', uploadError.message);
            return;
        }
        console.log('✅ Upload successful:', uploadData.path);
        
        // Test 4: Get public URL
        console.log('\n4. Getting public URL...');
        const { data: urlData } = supabase.storage
            .from('qr-codes')
            .getPublicUrl('test-qr.png');
        
        console.log('✅ Public URL:', urlData.publicUrl);
        
        // Test 5: List files in bucket
        console.log('\n5. Listing files in bucket...');
        const { data: files, error: filesError } = await supabase.storage
            .from('qr-codes')
            .list();
        
        if (filesError) {
            console.log('❌ List files error:', filesError.message);
        } else {
            console.log('✅ Files in bucket:', files.length);
            files.forEach(file => console.log(`  - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`));
        }
        
    } catch (error) {
        console.log('❌ General error:', error.message);
    }
}

testStorage();
