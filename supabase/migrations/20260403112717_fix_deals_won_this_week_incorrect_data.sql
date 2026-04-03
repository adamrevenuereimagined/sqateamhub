/*
  # Fix incorrect deals_won_this_week data

  This migration fixes a data quality issue where deals_won_this_week was storing
  revenue amounts instead of the count of deals won.

  ## Changes
  - Reset deals_won_this_week to 0 where values are unreasonably high (>100)
  - This field should contain the NUMBER of deals won, not revenue amounts
*/

-- Reset any deals_won_this_week values that are clearly revenue amounts (>100 deals is unrealistic)
UPDATE weekly_submissions
SET deals_won_this_week = 0
WHERE deals_won_this_week > 100;
