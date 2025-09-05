const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseDB {
    constructor() {
        this.supabase = supabase;
    }

    // Upload QR code to Supabase Storage
    async uploadQRCode(qrCodeBuffer, fileName) {
        try {
            const { data, error } = await this.supabase.storage
                .from('qr-codes')
                .upload(fileName, qrCodeBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (error) throw error;
            
            // Get public URL for the uploaded file
            const { data: urlData } = this.supabase.storage
                .from('qr-codes')
                .getPublicUrl(fileName);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading QR code to storage:', error);
            throw error;
        }
    }

    // Initialize database tables
    async initializeTables() {
        console.log('Database tables should be created in Supabase dashboard');
        console.log('Please run the SQL commands from setup-supabase.sql');
        return true;
    }

    // Get all attendees
    async getAllAttendees() {
        const { data, error } = await this.supabase
            .from('attendees')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Map database columns to application format
        return (data || []).map(row => this.mapDatabaseToApp(row));
    }

    // Map database column names to application format - Fix for frontend compatibility
    mapDatabaseToApp(dbRow) {
        if (!dbRow) return null;
        
        return {
            id: dbRow.id,
            name: dbRow.name,
            ticket_id: dbRow.ticket_id,  // Keep as ticket_id for frontend compatibility
            attendee_id: dbRow.ticket_id,  // Also provide as attendee_id for backwards compatibility
            email: dbRow.email,
            token: dbRow.qr_token,
            qr_code: dbRow.qr_code_path,
            qr_code_path: dbRow.qr_code_path,  // Also provide as qr_code_path for frontend compatibility
            photo_path: dbRow.photo_path,
            scanned: dbRow.is_scanned,
            scan_time: dbRow.scan_time,
            created_at: dbRow.created_at
        };
    }

    // Map application format to database columns
    mapAppToDatabase(appData) {
        return {
            name: appData.name,
            ticket_id: appData.attendee_id || appData.ticket_id,
            email: appData.email,
            qr_token: appData.token || appData.qr_token,
            qr_code_path: appData.qr_code || appData.qr_code_path,
            photo_path: appData.photo_path,
            is_scanned: appData.scanned || appData.is_scanned || false,
            scan_time: appData.scan_time
        };
    }

    // Get attendee by QR token
    async getAttendeeByToken(token) {
        const { data, error } = await this.supabase
            .from('attendees')
            .select('*')
            .eq('qr_token', token)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data ? this.mapDatabaseToApp(data) : null;
    }

    // Insert new attendee
    async insertAttendee(attendeeData) {
        const dbData = this.mapAppToDatabase(attendeeData);
        
        const { data, error } = await this.supabase
            .from('attendees')
            .insert(dbData)
            .select()
            .single();
        
        if (error) throw error;
        return this.mapDatabaseToApp(data);
    }

    // Update attendee
    async updateAttendee(id, updates) {
        const dbUpdates = this.mapAppToDatabase(updates);
        
        const { data, error } = await this.supabase
            .from('attendees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return this.mapDatabaseToApp(data);
    }

    // Update attendee by token (for scanning)
    async updateAttendeeByToken(token, updates) {
        const dbUpdates = this.mapAppToDatabase(updates);
        
        const { data, error } = await this.supabase
            .from('attendees')
            .update(dbUpdates)
            .eq('qr_token', token)
            .select()
            .single();
        
        if (error) throw error;
        return this.mapDatabaseToApp(data);
    }

    // Delete attendee
    async deleteAttendee(id) {
        const { data, error } = await this.supabase
            .from('attendees')
            .delete()
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Reset all scan statuses
    async resetAllScans() {
        const { data, error } = await this.supabase
            .from('attendees')
            .update({ 
                is_scanned: false, 
                scan_time: null 
            })
            .neq('id', 0); // Update all records
        
        if (error) throw error;
        return data;
    }

    // Clear all attendees
    async clearAllAttendees() {
        const { data, error } = await this.supabase
            .from('attendees')
            .delete()
            .neq('id', 0); // Delete all records
        
        if (error) throw error;
        return data;
    }

    // Get attendee count
    async getAttendeeCount() {
        const { count, error } = await this.supabase
            .from('attendees')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
    }

    // Search attendees
    async searchAttendees(name, ticketId) {
        let query = this.supabase.from('attendees').select('*');
        
        if (name && ticketId) {
            query = query.or(`name.ilike.%${name}%,ticket_id.eq.${ticketId}`);
        } else if (name) {
            query = query.ilike('name', `%${name}%`);
        } else if (ticketId) {
            query = query.eq('ticket_id', ticketId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(row => this.mapDatabaseToApp(row));
    }
}

module.exports = new SupabaseDB();