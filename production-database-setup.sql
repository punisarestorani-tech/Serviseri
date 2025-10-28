-- Production Database Setup SQL
-- Run this SQL on your PRODUCTION database via Replit Database pane

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (users/technicians)
CREATE TABLE IF NOT EXISTS profiles (
  user_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  email VARCHAR,
  user_role VARCHAR DEFAULT 'technician',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  client_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  client_name VARCHAR NOT NULL,
  client_address VARCHAR,
  client_contact VARCHAR,
  client_pib VARCHAR,
  client_pdv VARCHAR,
  client_account VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appliances table
CREATE TABLE IF NOT EXISTS appliances (
  appliance_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  client_id VARCHAR NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  appliance_maker VARCHAR,
  appliance_type VARCHAR,
  appliance_model VARCHAR,
  appliance_serial VARCHAR,
  appliance_picture VARCHAR,
  appliance_city VARCHAR,
  appliance_building VARCHAR,
  appliance_room VARCHAR,
  last_service_date DATE,
  next_service_date DATE,
  appliance_install_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  task_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  client_id VARCHAR NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  appliance_id VARCHAR REFERENCES appliances(appliance_id) ON DELETE SET NULL,
  user_id VARCHAR REFERENCES profiles(user_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  task_type TEXT NOT NULL DEFAULT 'one-time',
  task_description TEXT NOT NULL,
  task_due_date DATE,
  priority TEXT DEFAULT 'normal',
  recurrence_pattern TEXT DEFAULT 'none',
  recurrence_interval INTEGER DEFAULT 1,
  parent_task_id VARCHAR REFERENCES tasks(task_id) ON DELETE SET NULL,
  is_auto_generated INTEGER DEFAULT 0,
  next_occurrence_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  report_id VARCHAR
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  task_id VARCHAR NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  report_description TEXT NOT NULL,
  spare_parts_used TEXT,
  work_duration INTEGER,
  photos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  document_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  file_name VARCHAR NOT NULL,
  file_type VARCHAR,
  file_size INTEGER,
  file_url VARCHAR NOT NULL,
  related_to VARCHAR,
  related_id VARCHAR,
  uploaded_by VARCHAR REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spare_parts table
CREATE TABLE IF NOT EXISTS spare_parts (
  part_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::VARCHAR,
  part_number VARCHAR NOT NULL UNIQUE,
  part_name VARCHAR NOT NULL,
  manufacturer VARCHAR,
  description TEXT,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 0,
  unit_price NUMERIC(10, 2),
  location VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appliances_client ON appliances(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_appliance ON tasks(appliance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_reports_task ON reports(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_related ON documents(related_to, related_id);

-- Insert test user (lolo/lolo)
INSERT INTO profiles (user_id, username, password_hash, full_name, email, user_role)
VALUES ('test-user-001', 'lolo', 'lolo', 'Luka Petrović', 'luka@example.com', 'technician')
ON CONFLICT (username) DO NOTHING;

-- Verification queries (run these to confirm setup)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM profiles;
