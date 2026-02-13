/*
  # Add week tracking columns to weekly_goals

  1. Modified Tables
    - `weekly_goals`
      - Added `week_id` (uuid, references weeks) - the week the goal was set in
      - Added `sort_order` (integer) - display ordering
      - Added `status` (text) - pending/hit/partial/missed for tracking
      - Added `review_notes` (text) - notes added during the following week's review
      - Added `updated_at` (timestamptz)

  2. Important Notes
    - Goals set in Week N are reviewed in Week N+1
    - status tracks whether the goal was hit, partially achieved, or missed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'week_id'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN week_id uuid REFERENCES weeks(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN sort_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'status'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'hit', 'partial', 'missed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN review_notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_goals' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE weekly_goals ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
