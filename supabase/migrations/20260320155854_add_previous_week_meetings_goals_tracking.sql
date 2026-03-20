/*
  # Add Previous Week F2F Meetings Goal Tracking

  1. Changes
    - Add `previous_week_f2f_meetings_outcome` (jsonb) column to track if previous week's meeting goals were met
      - This will store an array of objects with structure: 
        {
          clientProspect: string,
          dates: string,
          where: string,
          goalOutcome: string (the original goal/outcome desired),
          goalMet: boolean,
          notes: string (optional notes about the outcome)
        }
    
  2. Security
    - No RLS changes needed - inherits from existing table policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'previous_week_f2f_meetings_outcome'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN previous_week_f2f_meetings_outcome jsonb;
  END IF;
END $$;