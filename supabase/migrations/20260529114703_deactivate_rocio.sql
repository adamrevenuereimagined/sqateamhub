/*
  # Deactivate Rocio

  Rocio has moved to CS. Setting is_active = false removes her from all active
  rep lists and dashboards while preserving all her historical submission data.
*/

UPDATE users
SET is_active = false
WHERE email = 'rocio@example.com'
  AND role = 'rep';
