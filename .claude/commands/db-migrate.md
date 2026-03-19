Create a new database migration file for the manager-agent project.

## Usage
/db-migrate <description>

Examples:
  /db-migrate add_player_stats_table
  /db-migrate add_notes_column_to_games

## What to do

**Step 1 — Find the next migration number**
List files in `supabase/migrations/`. Find the highest `NNNN_` prefix and increment by 1 (zero-padded to 4 digits).

**Step 2 — Create the file**
Path: `supabase/migrations/<NNNN>_<description>.sql`

Use this template:

```sql
-- Migration: <NNNN>_<description>
-- Created: <current date>
-- Description: TODO

-- ============================================================
-- UP
-- ============================================================

-- TODO: add your SQL here
-- Checklist for new tables:
--   1. Enable RLS: alter table public.X enable row level security;
--   2. Add RLS policy scoped to team owner:
--      create policy "X: team owner access" on public.X
--        for all
--        using (exists (
--          select 1 from public.teams t
--          where t.id = X.team_id and t.owner_id = auth.uid()
--        ))
--        with check (exists (
--          select 1 from public.teams t
--          where t.id = X.team_id and t.owner_id = auth.uid()
--        ));
--   3. Add updated_at trigger (if table has updated_at column):
--      create trigger trg_X_updated_at
--        before update on public.X
--        for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROLLBACK
-- ============================================================
-- drop table if exists public.X;
```

**Step 3 — Remind the developer**
- Update `src/types/database.ts` with any new types
- Apply the migration: paste into Supabase SQL Editor and run
- If adding a new table that the dashboard should show, update `useDashboard.ts`
