/*
  # Fix Authentication RLS Policies
  
  The issue is that our RLS policies on the users table require authentication,
  but Supabase needs to query the users table during the authentication process.
  
  ## Changes
  - Add a policy that allows service role to access users during auth
  - Add a policy for users to view their own profile during auth session
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view all active users" ON users;

-- Allow authenticated users to view all active users
CREATE POLICY "Authenticated users can view all active users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow users to view their own profile even during auth (using auth.uid())
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Allow service role (used during auth) to access all users
CREATE POLICY "Service role can access users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);
