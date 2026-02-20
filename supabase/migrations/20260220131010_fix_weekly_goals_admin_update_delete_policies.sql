/*
  # Fix Weekly Goals RLS Policies for Admin Update and Delete

  1. Changes
    - Drop and recreate UPDATE and DELETE policies
    - Ensure consistent admin access across all operations
  
  2. Security
    - Admins can update/delete any goals
    - Regular users can only update/delete their own goals
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own goals" ON weekly_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON weekly_goals;

-- Recreate UPDATE policy
CREATE POLICY "Users can update own goals or admins can update any goals"
  ON weekly_goals
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Recreate DELETE policy
CREATE POLICY "Users can delete own goals or admins can delete any goals"
  ON weekly_goals
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );