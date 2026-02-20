/*
  # Fix Weekly Goals UPDATE Policy - Add WITH CHECK

  1. Changes
    - Add WITH CHECK clause to UPDATE policy
    - This ensures the updated row also passes the security check
  
  2. Security
    - Users can only update goals where they are the owner or an admin
    - The updated row must also satisfy the same conditions
*/

-- Drop and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update own goals or admins can update any goals" ON weekly_goals;

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
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );