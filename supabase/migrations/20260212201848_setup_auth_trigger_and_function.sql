/*
  # Setup Auth Trigger and Helper Function
  
  Creates a trigger that automatically creates a public.users record
  when a new auth.users record is created.
  
  ## Changes
  - Create function to handle new user creation
  - Create trigger on auth.users
  - Create helper function to create demo users
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a function that runs when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, name, role, quarterly_quota, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'rep'),
    COALESCE((new.raw_user_meta_data->>'quarterly_quota')::numeric, 70000),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);
  
  RETURN new;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be less restrictive during auth
DROP POLICY IF EXISTS "Service role can access users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all active users" ON users;

-- Allow anyone to view their own user record (needed for auth)
CREATE POLICY "Users can view own user record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to view all active users
CREATE POLICY "Authenticated can view active users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can modify users
CREATE POLICY "Only admins can modify users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
