/*
  # Fix weekly_goals table for week-based goal tracking

  1. Schema Changes
    - Make `meeting_id` column nullable since goals can be tied to weeks without a meeting

  2. Security Changes
    - Add DELETE policy so users can delete their own goals (needed for the save/replace flow)
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'meeting_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE weekly_goals ALTER COLUMN meeting_id DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'weekly_goals' AND policyname = 'Users can delete own goals'
  ) THEN
    CREATE POLICY "Users can delete own goals"
      ON weekly_goals
      FOR DELETE
      TO authenticated
      USING (
        (user_id = auth.uid()) OR (EXISTS (
          SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        ))
      );
  END IF;
END $$;