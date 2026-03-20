-- Player payments table
-- Tracks payments made by players toward the team's costs (dues, registration fees, etc.)
-- Payments offset team expenses: net remaining = budget.total - expenses + collected payments

CREATE TABLE player_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  budget_id      UUID REFERENCES budgets(id) ON DELETE SET NULL,
  amount         DECIMAL(10,2) NOT NULL,
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status         TEXT NOT NULL DEFAULT 'outstanding'
                   CHECK (status IN ('outstanding', 'partial', 'paid')),
  description    TEXT NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_owner_player_payments" ON player_payments
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

CREATE TRIGGER set_updated_at_player_payments
  BEFORE UPDATE ON player_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
