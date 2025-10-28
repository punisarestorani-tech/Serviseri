-- =================================================================
-- KOMPLETAN SQL ZA SUPABASE - Service Management Application
-- =================================================================
-- Izvršite ovaj SQL u Supabase SQL Editor-u da kreirate sve tabele
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. PROFILES TABLE (Korisnici/Tehničari)
-- =================================================================
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE,
    user_role VARCHAR DEFAULT 'technician',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Korisnici sistema - tehničari i admini';
COMMENT ON COLUMN profiles.user_role IS 'Uloga: technician, admin';

-- =================================================================
-- 2. CLIENTS TABLE (Klijenti - Hoteli, Restorani)
-- =================================================================
CREATE TABLE IF NOT EXISTS clients (
    client_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_name VARCHAR NOT NULL,
    client_address VARCHAR,
    client_contact VARCHAR,
    client_pib VARCHAR,
    client_pdv VARCHAR,
    client_account VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Klijenti - hoteli, restorani, preduzeća';
COMMENT ON COLUMN clients.client_pib IS 'PIB broj';
COMMENT ON COLUMN clients.client_pdv IS 'PDV broj';
COMMENT ON COLUMN clients.client_account IS 'Broj računa';

-- =================================================================
-- 3. APPLIANCES TABLE (Aparati/Oprema)
-- =================================================================
CREATE TABLE IF NOT EXISTS appliances (
    appliance_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id VARCHAR NOT NULL,
    appliance_maker VARCHAR,
    appliance_type VARCHAR,
    appliance_model VARCHAR,
    appliance_serial VARCHAR,
    appliance_iga VARCHAR,
    appliance_picture VARCHAR,
    last_service_date DATE,
    next_service_date DATE,
    appliance_install_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT appliances_client_fk 
        FOREIGN KEY (client_id) 
        REFERENCES clients(client_id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE appliances IS 'Aparati i oprema kod klijenata';
COMMENT ON COLUMN appliances.appliance_maker IS 'Proizvođač aparata';
COMMENT ON COLUMN appliances.appliance_iga IS 'IGA broj';
COMMENT ON COLUMN appliances.appliance_picture IS 'URL fotografije aparata';
COMMENT ON COLUMN appliances.last_service_date IS 'Datum poslednjeg servisa';
COMMENT ON COLUMN appliances.next_service_date IS 'Planirani datum sledećeg servisa';

-- =================================================================
-- 4. TASKS TABLE (Zadaci) - SA RECURRING POLJIMA
-- =================================================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id VARCHAR NOT NULL,
    appliance_id VARCHAR,
    user_id VARCHAR,
    status TEXT NOT NULL DEFAULT 'pending',
    task_type TEXT NOT NULL DEFAULT 'one-time',
    task_description TEXT NOT NULL,
    task_due_date DATE,
    priority TEXT DEFAULT 'normal',
    
    -- Recurring tasks polja
    recurrence_pattern TEXT DEFAULT 'none',
    recurrence_interval INTEGER DEFAULT 1,
    parent_task_id VARCHAR,
    is_auto_generated INTEGER DEFAULT 0,
    next_occurrence_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    report_id VARCHAR,
    
    CONSTRAINT tasks_client_fk 
        FOREIGN KEY (client_id) 
        REFERENCES clients(client_id) 
        ON DELETE CASCADE,
    CONSTRAINT tasks_appliance_fk 
        FOREIGN KEY (appliance_id) 
        REFERENCES appliances(appliance_id) 
        ON DELETE SET NULL,
    CONSTRAINT tasks_user_fk 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT tasks_parent_fk 
        FOREIGN KEY (parent_task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE SET NULL
);

COMMENT ON TABLE tasks IS 'Zadaci i servisi';
COMMENT ON COLUMN tasks.status IS 'Status: pending, in_progress, completed';
COMMENT ON COLUMN tasks.task_type IS 'Tip: one-time, recurring';
COMMENT ON COLUMN tasks.priority IS 'Prioritet: low, normal, high';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'Obrazac ponavljanja: none, weekly, monthly, quarterly, semi-annual, yearly';
COMMENT ON COLUMN tasks.recurrence_interval IS 'Interval ponavljanja (npr. svake 2 nedelje)';
COMMENT ON COLUMN tasks.parent_task_id IS 'Referenca na parent task za recurring seriju';
COMMENT ON COLUMN tasks.is_auto_generated IS 'Da li je automatski generisan (0=ne, 1=da)';
COMMENT ON COLUMN tasks.next_occurrence_date IS 'Sledeći datum kada treba generisati novi task';

-- =================================================================
-- 5. REPORTS TABLE (Izveštaji)
-- =================================================================
CREATE TABLE IF NOT EXISTS reports (
    report_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    task_id VARCHAR NOT NULL,
    report_description TEXT NOT NULL,
    spare_parts_used TEXT,
    work_duration INTEGER,
    photos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reports_task_fk 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE reports IS 'Izveštaji o izvršenim servisima';
COMMENT ON COLUMN reports.spare_parts_used IS 'Korišćeni rezervni delovi (JSON ili tekst)';
COMMENT ON COLUMN reports.work_duration IS 'Trajanje rada u minutima';
COMMENT ON COLUMN reports.photos IS 'URL-ovi fotografija (JSON array)';

-- =================================================================
-- 6. DOCUMENTS TABLE (Dokumenti)
-- =================================================================
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR,
    document_url VARCHAR NOT NULL,
    related_to VARCHAR,
    related_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE documents IS 'Dokumenti i fajlovi';
COMMENT ON COLUMN documents.related_to IS 'Tip entiteta: task, report, client, appliance';
COMMENT ON COLUMN documents.related_id IS 'ID povezanog entiteta';

-- =================================================================
-- 7. SPARE_PARTS TABLE (Rezervni delovi - Inventar)
-- =================================================================
CREATE TABLE IF NOT EXISTS spare_parts (
    part_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    part_name VARCHAR NOT NULL,
    part_number VARCHAR,
    part_manufacturer VARCHAR,
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    unit_price DECIMAL(10, 2),
    location VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE spare_parts IS 'Inventar rezervnih delova';
COMMENT ON COLUMN spare_parts.part_number IS 'Kataloški broj';
COMMENT ON COLUMN spare_parts.minimum_stock_level IS 'Minimalni nivo zaliha';
COMMENT ON COLUMN spare_parts.location IS 'Lokacija u skladištu';

-- =================================================================
-- INDEXES ZA BOLJE PERFORMANSE
-- =================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_clients_pib ON clients(client_pib);

-- Appliances indexes
CREATE INDEX IF NOT EXISTS idx_appliances_client ON appliances(client_id);
CREATE INDEX IF NOT EXISTS idx_appliances_serial ON appliances(appliance_serial);
CREATE INDEX IF NOT EXISTS idx_appliances_next_service ON appliances(next_service_date);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_appliance ON tasks(appliance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(task_due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_due ON tasks(task_type, next_occurrence_date) 
    WHERE task_type = 'recurring';

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_task ON reports(task_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_related ON documents(related_to, related_id);

-- Spare parts indexes
CREATE INDEX IF NOT EXISTS idx_spare_parts_name ON spare_parts(part_name);
CREATE INDEX IF NOT EXISTS idx_spare_parts_number ON spare_parts(part_number);

-- =================================================================
-- USPEŠNO KREIRANA BAZA! 🎉
-- =================================================================
-- Sve tabele su kreirane sa:
-- ✅ UUID primary keys
-- ✅ Foreign key constraints
-- ✅ Indexes za brže pretraživanje
-- ✅ Recurring tasks polja
-- ✅ Komentari na tabelama i kolonama
-- =================================================================
