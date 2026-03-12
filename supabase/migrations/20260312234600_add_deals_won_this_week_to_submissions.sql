/*
  # Add Deals Won This Week to Weekly Submissions

  1. Changes
    - Add `deals_won_this_week` column to `weekly_submissions` table
      - Type: integer
      - Default: 0
      - Nullable

  2. Notes
    - Uses IF NOT EXISTS pattern to safely add column
    - This tracks the number of deals closed during the week
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'deals_won_this_week'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN deals_won_this_week integer DEFAULT 0;
  END IF;
END $$;
