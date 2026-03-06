/*
  # Add Deals Won This Week Column

  1. Changes
    - Add `deals_won_this_week` column to `weekly_goals` table
      - Type: integer
      - Default: 0
      - Not null
    - This field tracks the number of deals won during the week
  
  2. Notes
    - Uses IF NOT EXISTS pattern to safely add column
    - Default value prevents null issues
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'deals_won_this_week'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN deals_won_this_week integer DEFAULT 0 NOT NULL;
  END IF;
END $$;