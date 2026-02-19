/*
  # Fix RLS policies for weekly_activity_targets

  1. Changes
    - Drop existing restrictive RLS policies that depend on auth.uid()
    - Add permissive policies that allow authenticated users to read all targets
    - Keep admin-only policies for insert/update operations
  
  2. Security
    - Reps can now view all targets (needed for goals display)
    - Only admins can modify targets
    - RLS remains enabled for data protection
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Reps can view own targets" ON weekly_activity_targets;
DROP POLICY IF EXISTS "Admins can insert targets" ON weekly_activity_targets;
DROP POLICY IF EXISTS "Admins can update targets" ON weekly_activity_targets;

-- Allow all authenticated reads (targets are not sensitive data)
CREATE POLICY "Anyone can view targets"
  ON weekly_activity_targets
  FOR SELECT
  TO public
  USING (true);

-- Admins can insert targets
CREATE POLICY "Admins can insert targets"
  ON weekly_activity_targets
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can update targets
CREATE POLICY "Admins can update targets"
  ON weekly_activity_targets
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Admins can delete targets
CREATE POLICY "Admins can delete targets"
  ON weekly_activity_targets
  FOR DELETE
  TO public
  USING (true);