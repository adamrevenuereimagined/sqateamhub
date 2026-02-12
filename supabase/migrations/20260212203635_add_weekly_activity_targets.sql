/*
  # Add Weekly Activity Targets

  1. New Table
    - `weekly_activity_targets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `target_cold_calls` (integer) - Weekly cold call target
      - `target_emails` (integer) - Weekly email target
      - `target_li_messages` (integer) - Weekly LinkedIn message target
      - `target_videos` (integer) - Weekly video target
      - `target_dm_connects` (integer) - Weekly DM connect target
      - `target_meetings_booked` (integer) - Weekly meetings target
      - `target_discovery_calls` (integer) - Weekly discovery calls target
      - `target_opportunities_advanced` (integer) - Weekly opps advanced target
      - `target_pipeline_coverage` (numeric) - Pipeline coverage ratio target
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Reps can view their own targets
    - Admins can view and modify all targets
*/

CREATE TABLE IF NOT EXISTS weekly_activity_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_cold_calls integer DEFAULT 50,
  target_emails integer DEFAULT 100,
  target_li_messages integer DEFAULT 50,
  target_videos integer DEFAULT 10,
  target_dm_connects integer DEFAULT 15,
  target_meetings_booked integer DEFAULT 5,
  target_discovery_calls integer DEFAULT 3,
  target_opportunities_advanced integer DEFAULT 2,
  target_pipeline_coverage numeric DEFAULT 3.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_activity_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps can view own targets"
  ON weekly_activity_targets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert targets"
  ON weekly_activity_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update targets"
  ON weekly_activity_targets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_weekly_activity_targets_user_id ON weekly_activity_targets(user_id);
