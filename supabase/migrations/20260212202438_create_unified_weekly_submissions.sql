/*
  # Create Unified Weekly Submissions Schema

  This migration consolidates the separate 1:1 tracker and BD weekly forms into a single weekly submission that reps complete once per week on Thursdays.

  ## Changes
  
  1. New Tables
    - `weekly_submissions` - Single unified submission per rep per week containing all required information
      - Replaces both `one_on_one_submissions` and `bd_weekly_rep_data`
      - Contains activity metrics, deal updates, goals, and personal check-ins
    
    - `submission_commitments` - Action items from submissions (replaces `commitments`)
    
  2. Modified Tables
    - Keep `weeks` table as-is for week management
    - Remove dependency on `bd_weekly_meetings` for rep submissions
    
  3. Security
    - Disabled RLS (per current configuration)
    - All tables are publicly accessible for demo purposes

  ## Rationale
  - Eliminates duplicate data entry for reps
  - Single source of truth for weekly updates
  - Easier for reps to complete on Thursdays
  - Admin can view same data in multiple ways
*/

-- Create unified weekly submissions table
CREATE TABLE IF NOT EXISTS weekly_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  week_id uuid REFERENCES weeks(id) NOT NULL,
  
  -- Submission metadata
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Section 1: Wins & Momentum
  wins text[],
  whats_working_well text,
  positive_feedback text,
  
  -- Section 2: Activity Metrics (combines both forms' activity tracking)
  prospecting_activities integer DEFAULT 0,
  cold_calls integer DEFAULT 0,
  emails integer DEFAULT 0,
  li_messages integer DEFAULT 0,
  videos integer DEFAULT 0,
  decision_maker_connects integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  discovery_calls integer DEFAULT 0,
  opportunities_advanced integer DEFAULT 0,
  
  -- Section 3: Performance Snapshot
  pipeline_coverage_ratio numeric DEFAULT 0,
  revenue_mtd numeric DEFAULT 0,
  revenue_qtd numeric DEFAULT 0,
  average_deal_size numeric DEFAULT 0,
  
  -- Section 4: Pipeline & Deals (combines advancing, stalling, new, closing)
  deals_advancing jsonb DEFAULT '[]'::jsonb,
  deals_stalling jsonb DEFAULT '[]'::jsonb,
  new_deals jsonb DEFAULT '[]'::jsonb,
  closing_opportunities jsonb DEFAULT '[]'::jsonb,
  
  -- Section 5: Meetings & Coaching
  f2f_meetings jsonb DEFAULT '[]'::jsonb,
  call_review_link text,
  call_review_focus text,
  
  -- Section 6: Blockers & Support
  blockers_help text,
  deal_blockers text[],
  support_needed text[],
  
  -- Section 7: Goals
  this_week_goal text,
  last_week_goal_text text,
  last_week_goal_achieved text CHECK (last_week_goal_achieved IN ('yes', 'partial', 'no', NULL)),
  last_week_goal_notes text,
  
  -- Section 8: Personal Check-In
  self_care text,
  energy_level text DEFAULT 'medium' CHECK (energy_level IN ('high', 'medium', 'low')),
  manager_support text,
  
  UNIQUE(user_id, week_id)
);

-- Create submission commitments table (replaces old commitments table)
CREATE TABLE IF NOT EXISTS submission_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES weekly_submissions(id) ON DELETE CASCADE NOT NULL,
  commitment_text text NOT NULL,
  deadline text,
  success_metric text,
  status text DEFAULT 'in_progress' CHECK (status IN ('accomplished', 'in_progress', 'not_started', 'blocked')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS on new tables (matching current security configuration)
ALTER TABLE weekly_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_commitments DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_submissions_user_week ON weekly_submissions(user_id, week_id);
CREATE INDEX IF NOT EXISTS idx_weekly_submissions_week ON weekly_submissions(week_id);
CREATE INDEX IF NOT EXISTS idx_submission_commitments_submission ON submission_commitments(submission_id);
