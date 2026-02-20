/*
  # Allow Anonymous Access to Weekly Goals

  1. Problem
    - The app uses demo mode without real Supabase authentication
    - Policies require 'authenticated' role but requests use 'anon' role
    - Even with simplified policies, 401 errors persist

  2. Solution
    - Change policies to allow 'anon' role (the default for unauthenticated requests)
    - This matches how other tables in the app are configured for demo mode

  3. Security Note
    - This is appropriate for a demo/development environment
    - For production, proper authentication should be implemented
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated users to view goals" ON weekly_goals;
DROP POLICY IF EXISTS "Allow all authenticated users to insert goals" ON weekly_goals;
DROP POLICY IF EXISTS "Allow all authenticated users to update goals" ON weekly_goals;
DROP POLICY IF EXISTS "Allow all authenticated users to delete goals" ON weekly_goals;

-- Create policies that allow anon role (for demo mode)
CREATE POLICY "Allow anon to view goals"
  ON weekly_goals
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon to insert goals"
  ON weekly_goals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon to update goals"
  ON weekly_goals
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete goals"
  ON weekly_goals
  FOR DELETE
  TO anon, authenticated
  USING (true);