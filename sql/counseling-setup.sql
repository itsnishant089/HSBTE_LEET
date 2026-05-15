-- ============================================================
-- COUNSELING ADMISSION SYSTEM — Supabase (PostgreSQL) Tables
-- Run these in Supabase SQL Editor
-- ============================================================

-- TABLE 1: Counseling Users
CREATE TABLE IF NOT EXISTS counseling_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  diploma_haryana BOOLEAN,
  resident_haryana BOOLEAN,
  gender VARCHAR(20),
  dob DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_counsel_users_email ON counseling_users(email);
CREATE INDEX IF NOT EXISTS idx_counsel_users_mobile ON counseling_users(mobile);

-- TABLE 2: Counseling Requests
CREATE TABLE IF NOT EXISTS counseling_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES counseling_users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  branch_1 VARCHAR(150),
  branch_2 VARCHAR(150),
  branch_3 VARCHAR(150),
  branch_4 VARCHAR(150),
  branch_5 VARCHAR(150),
  college_preferences JSONB, -- stores array of {college, branch}
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewed','sent')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_counsel_req_user ON counseling_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_counsel_req_status ON counseling_requests(status);

-- TABLE 3: Admin Responses
CREATE TABLE IF NOT EXISTS counseling_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES counseling_requests(id) ON DELETE CASCADE,
  suggested_sr VARCHAR(50),
  suggested_college VARCHAR(255),
  suggested_branch VARCHAR(150),
  allotment_choices JSONB,
  notes TEXT, -- Admin remarks
  responded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_counsel_resp_req ON counseling_responses(request_id);

-- TABLE 4: Counseling Payments
CREATE TABLE IF NOT EXISTS counseling_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES counseling_users(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100),
  amount INTEGER DEFAULT 4900,
  status VARCHAR(20) DEFAULT 'paid',
  coupon_used VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_counsel_pay_user ON counseling_payments(user_id);

-- RLS Policies (enable RLS on all tables first)
ALTER TABLE counseling_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_payments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for registration/login
DROP POLICY IF EXISTS "Allow anon insert counseling_users" ON counseling_users;
CREATE POLICY "Allow anon insert counseling_users" ON counseling_users FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select counseling_users" ON counseling_users;
CREATE POLICY "Allow anon select counseling_users" ON counseling_users FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon update counseling_users" ON counseling_users;
CREATE POLICY "Allow anon update counseling_users" ON counseling_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert counseling_requests" ON counseling_requests;
CREATE POLICY "Allow anon insert counseling_requests" ON counseling_requests FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select counseling_requests" ON counseling_requests;
CREATE POLICY "Allow anon select counseling_requests" ON counseling_requests FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon update counseling_requests" ON counseling_requests;
CREATE POLICY "Allow anon update counseling_requests" ON counseling_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete counseling_requests" ON counseling_requests;
CREATE POLICY "Allow anon delete counseling_requests" ON counseling_requests FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert counseling_responses" ON counseling_responses;
CREATE POLICY "Allow anon insert counseling_responses" ON counseling_responses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select counseling_responses" ON counseling_responses;
CREATE POLICY "Allow anon select counseling_responses" ON counseling_responses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon update counseling_responses" ON counseling_responses;
CREATE POLICY "Allow anon update counseling_responses" ON counseling_responses FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon insert counseling_payments" ON counseling_payments;
CREATE POLICY "Allow anon insert counseling_payments" ON counseling_payments FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select counseling_payments" ON counseling_payments;
CREATE POLICY "Allow anon select counseling_payments" ON counseling_payments FOR SELECT TO anon USING (true);

-- ============================================================
-- MIGRATION STATEMENTS (Run if updating an existing database)
-- ============================================================

ALTER TABLE counseling_users 
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS diploma_haryana BOOLEAN,
  ADD COLUMN IF NOT EXISTS resident_haryana BOOLEAN,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dob DATE;

ALTER TABLE counseling_requests 
  ADD COLUMN IF NOT EXISTS college_preferences JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT;
  
ALTER TABLE counseling_responses
  ADD COLUMN IF NOT EXISTS suggested_sr VARCHAR(50),
  ADD COLUMN IF NOT EXISTS suggested_college VARCHAR(255),
  ADD COLUMN IF NOT EXISTS suggested_branch VARCHAR(150),
  ADD COLUMN IF NOT EXISTS allotment_choices JSONB,
  ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';
  
ALTER TABLE counseling_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS counseling_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES counseling_users(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counsel_chats_user ON counseling_chats(user_id);

ALTER TABLE counseling_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert counseling_chats" ON counseling_chats;
CREATE POLICY "Allow anon insert counseling_chats" ON counseling_chats FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select counseling_chats" ON counseling_chats;
CREATE POLICY "Allow anon select counseling_chats" ON counseling_chats FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon update counseling_chats" ON counseling_chats;
CREATE POLICY "Allow anon update counseling_chats" ON counseling_chats FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete counseling_chats" ON counseling_chats;
CREATE POLICY "Allow anon delete counseling_chats" ON counseling_chats FOR DELETE TO anon USING (true);

-- Reload Supabase Schema Cache so the frontend sees the new columns instantly
NOTIFY pgrst, 'reload schema';
