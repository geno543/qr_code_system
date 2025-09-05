-- SIMPLE Supabase Setup (No Policies - For Testing)
-- Run this MINIMAL SQL if you get policy errors

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

-- Disable RLS for now (easier setup)
ALTER TABLE attendees DISABLE ROW LEVEL SECURITY;

-- Insert some sample data for testing
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
