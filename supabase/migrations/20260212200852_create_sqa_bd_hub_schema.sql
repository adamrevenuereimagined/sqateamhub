/*
  # SQA BD Team Hub - Database Schema
  
  ## Overview
  Creates the complete database schema for the SQA BD Team Hub application,
  which manages weekly 1:1 trackers and BD team meeting agendas.
  
  ## New Tables
  
  ### 1. users
  Stores all team members (admin and reps)
  - `id` (uuid, primary key) - User identifier
  - `email` (text, unique) - User email for login
  - `name` (text) - Full name
  - `role` (text) - Either 'admin' or 'rep'
  - `quarterly_quota` (numeric) - Sales quota
  - `is_active` (boolean) - Account status
  - `created_at` (timestamptz) - Account creation date
  
  ### 2. weeks
  Tracks weekly cycles for the application
  - `id` (uuid, primary key)
  - `week_number` (integer) - Week number in year
  - `year` (integer) - Year
  - `start_date` (date) - Monday of the week
  - `end_date` (date) - Sunday of the week
  - `status` (text) - 'active' or 'archived'
  - `created_at` (timestamptz)
  
  ### 3. one_on_one_submissions
  Stores weekly 1:1 tracker submissions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Rep who submitted
  - `week_id` (uuid, foreign key) - Week reference
  - `is_one_on_one_week` (boolean) - Whether this week has a 1:1 meeting
  - Section data fields for all 9 sections
  - `status` (text) - 'not_started', 'in_progress', 'submitted'
  - `submitted_at` (timestamptz)
  
  ### 4. commitments
  Stores commitments from 1:1 Section 7 (auto-carries forward)
  - `id` (uuid, primary key)
  - `one_on_one_id` (uuid, foreign key)
  - `commitment_text` (text)
  - `deadline` (text)
  - `success_metric` (text)
  - `status` (text) - For next week's review
  - `notes` (text) - What got in the way
  
  ### 5. bd_weekly_meetings
  Stores BD Weekly team meeting data (admin sections)
  - `id` (uuid, primary key)
  - `week_id` (uuid, foreign key)
  - Admin-only section fields (Scoreboard, Adam Topics, etc.)
  - `pipeline_chart_url` (text) - Uploaded chart image
  
  ### 6. bd_weekly_rep_data
  Stores per-rep sections in BD Weekly
  - `id` (uuid, primary key)
  - `meeting_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `section_name` (text) - Which section this belongs to
  - `data` (jsonb) - Flexible storage for section data
  
  ### 7. weekly_goals
  Stores goals from BD Weekly Section 11 (auto-carries forward)
  - `id` (uuid, primary key)
  - `meeting_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `goal_text` (text)
  - `achieved` (text) - 'yes', 'partial', 'no', or null
  - `notes` (text)
  
  ## Security
  - Enable RLS on all tables
  - Admins can access all data
  - Reps can only access their own 1:1 data
  - Reps can access shared BD Weekly data (read) and their own rows (write)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'rep')),
  quarterly_quota numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create weeks table
CREATE TABLE IF NOT EXISTS weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(year, week_number)
);

-- Create one_on_one_submissions table
CREATE TABLE IF NOT EXISTS one_on_one_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  week_id uuid REFERENCES weeks(id) ON DELETE CASCADE NOT NULL,
  is_one_on_one_week boolean DEFAULT false,
  
  -- Section 2: Wins & Momentum
  wins jsonb DEFAULT '[]'::jsonb,
  whats_working_well text DEFAULT '',
  positive_feedback text DEFAULT '',
  
  -- Section 3: Performance Snapshot
  prospecting_activities integer DEFAULT 0,
  decision_maker_connects integer DEFAULT 0,
  discovery_calls integer DEFAULT 0,
  opportunities_advanced integer DEFAULT 0,
  pipeline_coverage_ratio numeric DEFAULT 0,
  revenue_mtd numeric DEFAULT 0,
  revenue_qtd numeric DEFAULT 0,
  average_deal_size numeric DEFAULT 0,
  
  -- Section 4B: Deals Moved Forward
  deals_moved_forward jsonb DEFAULT '[]'::jsonb,
  
  -- Section 4C: Deals At Risk
  deals_at_risk jsonb DEFAULT '[]'::jsonb,
  
  -- Section 4A: Top Deals (conditional on 1:1 weeks)
  top_deals jsonb DEFAULT '[]'::jsonb,
  
  -- Section 5: Call Review
  call_review_link text DEFAULT '',
  call_review_focus text DEFAULT '',
  
  -- Section 6: Blockers & Support
  blockers_help text DEFAULT '',
  deal_blockers jsonb DEFAULT '[]'::jsonb,
  support_needed jsonb DEFAULT '[]'::jsonb,
  
  -- Section 8: Personal Check-In
  self_care text DEFAULT '',
  energy_level text DEFAULT 'medium' CHECK (energy_level IN ('high', 'medium', 'low')),
  manager_support text DEFAULT '',
  
  -- Section 9: Deal Coaching (conditional on 1:1 weeks)
  deal_selected_link text DEFAULT '',
  spiced_situation text DEFAULT '',
  spiced_pain text DEFAULT '',
  spiced_impact text DEFAULT '',
  spiced_critical_event text DEFAULT '',
  spiced_decision text DEFAULT '',
  spiced_decision_process text DEFAULT '',
  
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, week_id)
);

-- Create commitments table (Section 7 of 1:1)
CREATE TABLE IF NOT EXISTS commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id uuid REFERENCES one_on_one_submissions(id) ON DELETE CASCADE NOT NULL,
  commitment_text text NOT NULL,
  deadline text DEFAULT '',
  success_metric text DEFAULT '',
  status text DEFAULT 'in_progress' CHECK (status IN ('accomplished', 'in_progress', 'not_started', 'blocked')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create bd_weekly_meetings table
CREATE TABLE IF NOT EXISTS bd_weekly_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid REFERENCES weeks(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Section 1: Scoreboard (admin only)
  team_mtd_target numeric DEFAULT 0,
  team_mtd_actual numeric DEFAULT 0,
  team_qtd_target numeric DEFAULT 0,
  team_qtd_actual numeric DEFAULT 0,
  deals_closed_this_week integer DEFAULT 0,
  team_pipeline_coverage numeric DEFAULT 0,
  
  -- Section 2: Win of the Week
  win_rep_name text DEFAULT '',
  win_details text DEFAULT '',
  win_takeaway text DEFAULT '',
  
  -- Section 6: Adam Topics (admin only)
  adam_topics text DEFAULT '',
  
  -- Section 8: Coaching Moment (admin only)
  coaching_focus text DEFAULT '',
  coaching_leader text DEFAULT '',
  
  -- Section 9: Market Intel (collaborative)
  messaging_landing text DEFAULT '',
  objections_hearing text DEFAULT '',
  competitive_intel text DEFAULT '',
  content_needs text DEFAULT '',
  
  -- Section 10: Executive Assist (admin only)
  exec_assist_deals text DEFAULT '',
  exec_assist_financial text DEFAULT '',
  exec_assist_partnerships text DEFAULT '',
  
  -- Section 13: Open BD Topics (collaborative)
  open_topics text DEFAULT '',
  
  -- Pipeline charts
  pipeline_chart_url text DEFAULT '',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bd_weekly_rep_data table for per-rep sections
CREATE TABLE IF NOT EXISTS bd_weekly_rep_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES bd_weekly_meetings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Section 3: Activity & Outcomes Review
  cold_calls integer DEFAULT 0,
  emails integer DEFAULT 0,
  li_messages integer DEFAULT 0,
  videos integer DEFAULT 0,
  dm_connects integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  deals_advanced integer DEFAULT 0,
  
  -- Section 4: Pipeline Movement (three sub-tables as jsonb)
  deals_advancing jsonb DEFAULT '[]'::jsonb,
  deals_stalling jsonb DEFAULT '[]'::jsonb,
  new_deals jsonb DEFAULT '[]'::jsonb,
  
  -- Section 5: Closing Opportunities
  closing_opportunities jsonb DEFAULT '[]'::jsonb,
  
  -- Section 7: Face-to-Face Meetings
  f2f_meetings jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(meeting_id, user_id)
);

-- Create weekly_goals table (Section 11 & 12 of BD Weekly)
CREATE TABLE IF NOT EXISTS weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES bd_weekly_meetings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  goal_text text NOT NULL,
  achieved text CHECK (achieved IN ('yes', 'partial', 'no') OR achieved IS NULL),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_weekly_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_weekly_rep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all active users"
  ON users FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for weeks table
CREATE POLICY "Everyone can view weeks"
  ON weeks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage weeks"
  ON weeks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for one_on_one_submissions
CREATE POLICY "Reps can view own 1:1 submissions"
  ON one_on_one_submissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Reps can insert own 1:1 submissions"
  ON one_on_one_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reps can update own 1:1 submissions"
  ON one_on_one_submissions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for commitments
CREATE POLICY "Users can view commitments for accessible 1:1s"
  ON commitments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM one_on_one_submissions
      WHERE one_on_one_submissions.id = commitments.one_on_one_id
      AND (
        one_on_one_submissions.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Users can manage commitments for accessible 1:1s"
  ON commitments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM one_on_one_submissions
      WHERE one_on_one_submissions.id = commitments.one_on_one_id
      AND (
        one_on_one_submissions.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

-- RLS Policies for bd_weekly_meetings
CREATE POLICY "Everyone can view BD Weekly meetings"
  ON bd_weekly_meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage BD Weekly meetings"
  ON bd_weekly_meetings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for bd_weekly_rep_data
CREATE POLICY "Everyone can view BD Weekly rep data"
  ON bd_weekly_rep_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reps can insert own BD Weekly data"
  ON bd_weekly_rep_data FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Reps can update own BD Weekly data"
  ON bd_weekly_rep_data FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for weekly_goals
CREATE POLICY "Everyone can view weekly goals"
  ON weekly_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own goals"
  ON weekly_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own goals"
  ON weekly_goals FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_one_on_one_user_week ON one_on_one_submissions(user_id, week_id);
CREATE INDEX IF NOT EXISTS idx_commitments_one_on_one ON commitments(one_on_one_id);
CREATE INDEX IF NOT EXISTS idx_bd_rep_data_meeting_user ON bd_weekly_rep_data(meeting_id, user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_meeting_user ON weekly_goals(meeting_id, user_id);
CREATE INDEX IF NOT EXISTS idx_weeks_status ON weeks(status);
