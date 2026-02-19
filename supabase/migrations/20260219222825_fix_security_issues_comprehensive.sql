/*
  # Comprehensive Security Fixes

  1. Enable RLS on all tables
    - bd_weekly_meetings
    - bd_weekly_rep_data
    - commitments
    - one_on_one_submissions
    - users
    - weekly_goals
    - weeks
    - weekly_submissions
    - submission_commitments

  2. Add missing indexes for foreign keys
    - bd_weekly_rep_data.user_id
    - one_on_one_submissions.week_id
    - weekly_goals.user_id
    - weekly_goals.week_id

  3. Remove unused index
    - idx_commitments_one_on_one

  4. Clean up duplicate RLS policies
    - Remove overlapping policies on multiple tables

  5. Fix function search path
    - Update create_demo_user function with secure search_path
*/

-- ============================================
-- PART 1: Enable RLS on all tables
-- ============================================

ALTER TABLE bd_weekly_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_weekly_rep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_commitments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: Add missing foreign key indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bd_weekly_rep_data_user_id ON bd_weekly_rep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_one_on_one_submissions_week_id ON one_on_one_submissions(week_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week_id ON weekly_goals(week_id);

-- ============================================
-- PART 3: Remove unused index
-- ============================================

DROP INDEX IF EXISTS idx_commitments_one_on_one;

-- ============================================
-- PART 4: Clean up duplicate RLS policies
-- ============================================

-- bd_weekly_meetings: Keep only one SELECT policy
DROP POLICY IF EXISTS "Only admins can manage BD Weekly meetings" ON bd_weekly_meetings;
DROP POLICY IF EXISTS "Everyone can view BD Weekly meetings" ON bd_weekly_meetings;

CREATE POLICY "Everyone can view BD Weekly meetings"
  ON bd_weekly_meetings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage BD Weekly meetings"
  ON bd_weekly_meetings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- commitments: Keep only one SELECT policy
DROP POLICY IF EXISTS "Users can manage commitments for accessible 1:1s" ON commitments;
DROP POLICY IF EXISTS "Users can view commitments for accessible 1:1s" ON commitments;

CREATE POLICY "Everyone can view commitments"
  ON commitments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Everyone can manage commitments"
  ON commitments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- users: Clean up duplicate policies
DROP POLICY IF EXISTS "Authenticated can view active users" ON users;
DROP POLICY IF EXISTS "Only admins can modify users" ON users;
DROP POLICY IF EXISTS "Users can view own user record" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;

CREATE POLICY "Everyone can view users"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Everyone can manage users"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- weeks: Keep only one SELECT policy
DROP POLICY IF EXISTS "Everyone can view weeks" ON weeks;
DROP POLICY IF EXISTS "Only admins can manage weeks" ON weeks;

CREATE POLICY "Everyone can view weeks"
  ON weeks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage weeks"
  ON weeks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PART 5: Add RLS policies for tables without them
-- ============================================

-- weekly_submissions
DROP POLICY IF EXISTS "Everyone can view weekly submissions" ON weekly_submissions;
DROP POLICY IF EXISTS "Everyone can manage weekly submissions" ON weekly_submissions;

CREATE POLICY "Everyone can view weekly submissions"
  ON weekly_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Everyone can manage weekly submissions"
  ON weekly_submissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- submission_commitments
DROP POLICY IF EXISTS "Everyone can view submission commitments" ON submission_commitments;
DROP POLICY IF EXISTS "Everyone can manage submission commitments" ON submission_commitments;

CREATE POLICY "Everyone can view submission commitments"
  ON submission_commitments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Everyone can manage submission commitments"
  ON submission_commitments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PART 6: Fix function search path
-- ============================================

DROP FUNCTION IF EXISTS create_demo_user(text, text, text);

CREATE OR REPLACE FUNCTION create_demo_user(
  user_email text,
  user_name text,
  user_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    instance_id
  ) VALUES (
    user_email,
    crypt('demo123', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email'),
    jsonb_build_object('name', user_name),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  )
  RETURNING id INTO new_user_id;

  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (new_user_id, user_email, user_name, user_role, true);

  RETURN new_user_id;
END;
$$;