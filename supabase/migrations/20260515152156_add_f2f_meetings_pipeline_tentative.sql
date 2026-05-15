/*
  # Add f2f_meetings_pipeline_tentative column

  Adds a new JSONB column to weekly_submissions to store tentative/unconfirmed
  in-person meetings in the pipeline — meetings the rep is working to schedule
  but that don't yet have a confirmed date.

  Each entry: { clientProspect, dealOpportunity, tentativeTimeframe, confirmationPlan }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'f2f_meetings_pipeline_tentative'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN f2f_meetings_pipeline_tentative jsonb;
  END IF;
END $$;
