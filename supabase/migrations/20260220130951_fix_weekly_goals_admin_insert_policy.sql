/*
  # Fix Weekly Goals RLS Policy for Admin Insert

  1. Changes
    - Drop and recreate the INSERT policy for weekly_goals
    - Allow admins to insert goals for any user
    - Allow users to insert their own goals
  
  2. Security
    - Admins can create goals for any user
    - Regular users can only create their own goals
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own goals" ON weekly_goals;

-- Recreate with proper admin check
CREATE POLICY "Users can insert own goals or admins can insert any goals"
  ON weekly_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );