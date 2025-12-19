-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tourists table
CREATE TABLE tourists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    passport_no VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    home_address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hotel_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bikes table
CREATE TABLE bikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model VARCHAR(100) NOT NULL,
    frame_no VARCHAR(100) UNIQUE NOT NULL,
    plate_no VARCHAR(20) UNIQUE NOT NULL,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'rented', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agreements table
CREATE TABLE agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_no VARCHAR(50) UNIQUE NOT NULL,
    tourist_id UUID REFERENCES tourists(id) ON DELETE CASCADE,
    bike_id UUID REFERENCES bikes(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'completed')),
    pdf_url TEXT,
    signature_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest links table
CREATE TABLE guest_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events table
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_agreements_tourist_id ON agreements(tourist_id);
CREATE INDEX idx_agreements_bike_id ON agreements(bike_id);
CREATE INDEX idx_agreements_admin_id ON agreements(admin_id);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_agreements_agreement_no ON agreements(agreement_no);
CREATE INDEX idx_guest_links_token ON guest_links(token);
CREATE INDEX idx_guest_links_agreement_id ON guest_links(agreement_id);
CREATE INDEX idx_audit_events_agreement_id ON audit_events(agreement_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);

-- Grant permissions for Supabase
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

GRANT SELECT ON tourists TO anon;
GRANT ALL PRIVILEGES ON tourists TO authenticated;

GRANT SELECT ON bikes TO anon;
GRANT ALL PRIVILEGES ON bikes TO authenticated;

GRANT SELECT ON agreements TO anon;
GRANT ALL PRIVILEGES ON agreements TO authenticated;

GRANT SELECT ON guest_links TO anon;
GRANT ALL PRIVILEGES ON guest_links TO authenticated;

GRANT SELECT ON audit_events TO anon;
GRANT ALL PRIVILEGES ON audit_events TO authenticated;

-- Insert sample bikes
INSERT INTO bikes (model, frame_no, plate_no, availability_status) VALUES
('Honda Dio', 'HF0001', 'NA-1234', 'available'),
('Yamaha Ray-Z', 'YR0002', 'NA-5678', 'available'),
('TVS Jupiter', 'TJ0003', 'NA-9012', 'available'),
('Suzuki Access', 'SA0004', 'NA-3456', 'available'),
('Bajaj Pulsar', 'BP0005', 'NA-7890', 'available');