-- Add is_current flag to budgets
-- Allows a team to have one active/current budget across multiple seasons.
-- A partial unique index enforces at most one current budget per team.

ALTER TABLE budgets ADD COLUMN is_current BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX budgets_one_current_per_team
  ON budgets (team_id)
  WHERE is_current = true;
