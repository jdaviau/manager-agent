-- Migration: 0001_initial_schema
-- Description: Initial tables for sports team management app

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner read/write"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  sport        text,
  season       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "teams: owner full access"
  on public.teams
  for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ============================================================
-- PLAYERS
-- ============================================================
create table public.players (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  name          text not null,
  jersey_number text,
  position      text,
  status        text not null default 'active',
  joined_at     date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.players enable row level security;

create policy "players: team owner access"
  on public.players
  for all
  using (exists (
    select 1 from public.teams t
    where t.id = players.team_id and t.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.teams t
    where t.id = players.team_id and t.owner_id = auth.uid()
  ));

-- ============================================================
-- BUDGETS (one per team per season)
-- ============================================================
create table public.budgets (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  season        text not null,
  total_amount  numeric(10,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (team_id, season)
);

alter table public.budgets enable row level security;

create policy "budgets: team owner access"
  on public.budgets
  for all
  using (exists (
    select 1 from public.teams t
    where t.id = budgets.team_id and t.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.teams t
    where t.id = budgets.team_id and t.owner_id = auth.uid()
  ));

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================
create type public.expense_category as enum (
  'equipment',
  'travel',
  'fees',
  'facilities',
  'medical',
  'uniforms',
  'other'
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table public.expenses (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  budget_id     uuid references public.budgets(id) on delete set null,
  category      public.expense_category not null default 'other',
  description   text not null,
  amount        numeric(10,2) not null,
  expense_date  date not null default current_date,
  receipt_url   text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses: team owner access"
  on public.expenses
  for all
  using (exists (
    select 1 from public.teams t
    where t.id = expenses.team_id and t.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.teams t
    where t.id = expenses.team_id and t.owner_id = auth.uid()
  ));

-- ============================================================
-- GAMES / SESSIONS
-- ============================================================
create table public.games (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  opponent      text,
  game_date     date not null,
  location      text,
  is_home       boolean not null default true,
  player_count  int,
  result        text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "games: team owner access"
  on public.games
  for all
  using (exists (
    select 1 from public.teams t
    where t.id = games.team_id and t.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.teams t
    where t.id = games.team_id and t.owner_id = auth.uid()
  ));

-- ============================================================
-- TRIGGER: update updated_at automatically
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

create trigger trg_players_updated_at
  before update on public.players
  for each row execute procedure public.set_updated_at();

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute procedure public.set_updated_at();

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.set_updated_at();

create trigger trg_games_updated_at
  before update on public.games
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- AUTO-CREATE profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
