-- Allow multiple Sunday specials per week (drop the unique on week_starting).
-- The composite index sunday_specials_week_starting_is_active_idx is kept.
DROP INDEX "sunday_specials_week_starting_key";
