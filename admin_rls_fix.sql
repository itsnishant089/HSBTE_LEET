-- Run this snippet in your Supabase SQL Editor. 
-- It allows the 'anon' key (used by premium-admin.html) to perform the necessary actions like Deletes and Updates.

ALTER TABLE premium_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE premium_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_premium_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE premium_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;

-- Note: The safest approach long-term is to define specific policies for admin vs users, 
-- but for a fast Hackathon/development phase, disabling RLS lets the Anon key operate fully.
