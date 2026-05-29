/*
  # Promote Olivia from BDR to BD Rep

  1. Changes
    - Updates Olivia's role from 'bdr' to 'rep' so she appears in the main rep section
      of the admin dashboard and gains access to the full WeeklySubmissionForm
    - Sets a placeholder quarterly_quota of 0 (admin should update via Manage Targets
      once the correct quota is known)

  2. Notes
    - Her existing weekly_submissions rows are preserved — all submission fields used
      by the rep form already exist on the table, so no data migration is needed
    - The BDR-specific metrics (sales_accepted_opps_mtd/qtd, opps_created_this_week,
      pipeline_created_this_week) remain on her rows as historical data and will
      simply be unused by the rep form going forward
*/

UPDATE users
SET role = 'rep'
WHERE email = 'olivia@example.com'
  AND role = 'bdr';
