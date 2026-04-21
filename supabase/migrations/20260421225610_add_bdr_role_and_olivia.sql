/*
  # Add BDR role and Olivia user

  1. Changes
    - Drops existing role check constraint and adds 'bdr' as a valid role
    - Inserts Olivia as a BDR user
    - Adds BDR-specific performance metric columns to weekly_submissions:
      - sales_accepted_opps_mtd: Sales Accepted Opportunities MTD
      - sales_accepted_opps_qtd: Sales Accepted Opportunities QTD
      - opps_created_this_week: Opportunities Created This Week (count)
      - pipeline_created_this_week: Pipeline dollar value created this week
*/

-- Drop old role check constraint and recreate with bdr included
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_type = 'CHECK' AND constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'rep', 'bdr'));

-- Add BDR-specific columns to weekly_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'sales_accepted_opps_mtd'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN sales_accepted_opps_mtd integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'sales_accepted_opps_qtd'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN sales_accepted_opps_qtd integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'opps_created_this_week'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN opps_created_this_week integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekly_submissions' AND column_name = 'pipeline_created_this_week'
  ) THEN
    ALTER TABLE weekly_submissions ADD COLUMN pipeline_created_this_week numeric(12,2) DEFAULT 0;
  END IF;
END $$;

-- Insert Olivia as BDR
INSERT INTO users (id, email, name, role, quarterly_quota, is_active)
VALUES (
  gen_random_uuid(),
  'olivia@example.com',
  'Olivia',
  'bdr',
  0,
  true
)
ON CONFLICT (email) DO NOTHING;
