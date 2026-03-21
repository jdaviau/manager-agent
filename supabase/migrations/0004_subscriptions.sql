-- Subscription tracking per user (one row per user, upserted on Stripe events)
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan                    TEXT NOT NULL DEFAULT 'core'
                            CHECK (plan IN ('core', 'pro')),
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX subscriptions_user_id_idx ON subscriptions (user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_subscriptions" ON subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Monthly prompt usage counter per user
CREATE TABLE prompt_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL,  -- e.g. '2026-03'
  count        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year_month)
);

ALTER TABLE prompt_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_prompt_usage" ON prompt_usage
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER set_updated_at_prompt_usage
  BEFORE UPDATE ON prompt_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
