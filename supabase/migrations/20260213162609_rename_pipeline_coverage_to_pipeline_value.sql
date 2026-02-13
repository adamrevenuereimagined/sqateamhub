/*
  # Rename pipeline coverage to pipeline value

  1. Modified Tables
    - `weekly_activity_targets`
      - Renamed `target_pipeline_coverage` to `target_pipeline_value` (numeric)
      - Changed default from 3.0 (ratio) to 0 (dollar amount)
      - Updated existing rows to 3x each rep's quarterly quota

  2. Important Notes
    - Pipeline Value now stores a dollar amount (e.g., $300,000) instead of a coverage ratio (e.g., 3.0x)
    - Auto-populated as 3x the BD's quarterly quota
*/

ALTER TABLE weekly_activity_targets
RENAME COLUMN target_pipeline_coverage TO target_pipeline_value;

ALTER TABLE weekly_activity_targets
ALTER COLUMN target_pipeline_value SET DEFAULT 0;

UPDATE weekly_activity_targets t
SET target_pipeline_value = COALESCE(u.quarterly_quota, 0) * 3
FROM users u
WHERE t.user_id = u.id;
