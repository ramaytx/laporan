-- Enterprise Maintenance Management System
-- Initial Supabase Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- Administrator, Manager, Supervisor, Teknisi, Viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Hashed password
    phone VARCHAR(50),
    avatar VARCHAR(255),
    role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: area
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_area VARCHAR(255) NOT NULL,
    kode_area VARCHAR(50) UNIQUE NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: lokasi
CREATE TABLE lokasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID REFERENCES areas(id) ON DELETE CASCADE,
    nama_lokasi VARCHAR(255) NOT NULL,
    lantai VARCHAR(50),
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: kategori
CREATE TABLE kategori (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(100) NOT NULL UNIQUE, -- Preventive, Corrective, Emergency, Inspection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: laporan
CREATE TABLE laporan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laporan_no VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated like LAP-20231024-001
    tanggal DATE NOT NULL,
    jam TIME NOT NULL,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    kategori_id UUID REFERENCES kategori(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES areas(id) ON DELETE RESTRICT,
    lokasi_id UUID REFERENCES lokasi(id) ON DELETE RESTRICT,
    petugas_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PENDING, APPROVED, REJECTED, REVISION, COMPLETED
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: foto
CREATE TABLE foto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laporan_id UUID REFERENCES laporan(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    before_after VARCHAR(20), -- BEFORE, DURING, AFTER
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: temuan
CREATE TABLE temuan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    laporan_id UUID REFERENCES laporan(id) ON DELETE CASCADE,
    temuan TEXT NOT NULL,
    rekomendasi TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, CLOSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: log (Audit Log)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity VARCHAR(255) NOT NULL,
    ip VARCHAR(50),
    browser VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers to auto update `updated_at`

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_areas
BEFORE UPDATE ON areas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_lokasi
BEFORE UPDATE ON lokasi
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_laporan
BEFORE UPDATE ON laporan
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_temuan
BEFORE UPDATE ON temuan
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- INSERT DEFAULT ROLES
INSERT INTO roles (name) VALUES 
('Administrator'), 
('Manager'), 
('Supervisor'), 
('Teknisi'), 
('Viewer');

-- INSERT DEFAULT KATEGORI
INSERT INTO kategori (nama) VALUES 
('Preventive'), 
('Corrective'), 
('Emergency'), 
('Inspection');
