-- QR Event Management System - Supabase Setup
-- This script works with EXISTING database schema
-- Run this SQL in your Supabase SQL Editor

-- Create attendees table with existing column names
CREATE TABLE IF NOT EXISTS attendees (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ticket_id TEXT NOT NULL,
    email TEXT,
    qr_token TEXT UNIQUE NOT NULL,
    qr_code_path TEXT,
    photo_path TEXT,
    is_scanned BOOLEAN DEFAULT FALSE,
    scan_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendees_qr_token ON attendees(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendees_ticket_id ON attendees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees(name);
CREATE INDEX IF NOT EXISTS idx_attendees_is_scanned ON attendees(is_scanned);

-- Enable Row Level Security (RLS)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Public read access" ON attendees;
DROP POLICY IF EXISTS "Public insert access" ON attendees;
DROP POLICY IF EXISTS "Public update access" ON attendees;
DROP POLICY IF EXISTS "Public delete access" ON attendees;

-- Create policies for public access (adjust as needed for your security requirements)
-- Policy for reading attendees (public read access)
CREATE POLICY "Public read access" ON attendees
    FOR SELECT USING (true);

-- Policy for inserting attendees (public insert access for uploads)
CREATE POLICY "Public insert access" ON attendees
    FOR INSERT WITH CHECK (true);

-- Policy for updating attendees (public update access for scanning)
CREATE POLICY "Public update access" ON attendees
    FOR UPDATE USING (true);

-- Policy for deleting attendees (public delete access for admin)
CREATE POLICY "Public delete access" ON attendees
    FOR DELETE USING (true);

-- Create a storage bucket for QR codes and photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist, then create new ones
DROP POLICY IF EXISTS "QR codes read access" ON storage.objects;
DROP POLICY IF EXISTS "QR codes insert access" ON storage.objects;
DROP POLICY IF EXISTS "Photos read access" ON storage.objects;
DROP POLICY IF EXISTS "Photos insert access" ON storage.objects;

-- Storage policies for public access
CREATE POLICY "QR codes read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "QR codes insert access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'qr-codes');

CREATE POLICY "Photos read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Photos insert access" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Insert some sample data for testing (optional - you can remove this section)
INSERT INTO attendees (name, ticket_id, email, qr_token, qr_code_path) VALUES
('John Doe', 'TEST-001', 'john@example.com', 'sample-token-1', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
('Jane Smith', 'TEST-002', 'jane@example.com', 'sample-token-2', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
('Bob Johnson', 'TEST-003', 'bob@example.com', 'sample-token-3', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
ON CONFLICT (qr_token) DO NOTHING;

-- Verify the setup
SELECT 'Setup complete! Tables created:' as message;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendees';
SELECT 'Sample data:' as message;
SELECT name, ticket_id, qr_token FROM attendees LIMIT 3;
