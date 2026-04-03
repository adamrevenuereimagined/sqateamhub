/*
  # Add Face-to-Face Meetings HELD Last Week tracking

  ## Changes
  - Add f2f_meetings_held_last_week column to weekly_submissions
  - This tracks meetings that were actually held in the previous week
  - Uses same JSONB structure as f2f_meetings for consistency
*/

-- Add column for tracking face-to-face meetings held last week
ALTER TABLE weekly_submissions
ADD COLUMN IF NOT EXISTS f2f_meetings_held_last_week JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN weekly_submissions.f2f_meetings_held_last_week IS 'Array of face-to-face meetings that were held last week, same structure as f2f_meetings';
