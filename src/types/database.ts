export type ExpenseCategory =
  | "equipment"
  | "travel"
  | "fees"
  | "facilities"
  | "medical"
  | "uniforms"
  | "other";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  owner_id: string;
  name: string;
  sport: string | null;
  season: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: string | null;
  position: string | null;
  status: "active" | "inactive" | "injured";
  joined_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  team_id: string;
  season: string;
  total_amount: number;
  is_current: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  team_id: string;
  budget_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  team_id: string;
  opponent: string | null;
  game_date: string;
  location: string | null;
  is_home: boolean;
  player_count: number | null;
  result: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "outstanding" | "partial" | "paid";

export interface PlayerPayment {
  id: string;
  team_id: string;
  player_id: string;
  budget_id: string | null;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  description: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Generic Supabase DB type used by createClient
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      teams: { Row: Team; Insert: Partial<Team>; Update: Partial<Team> };
      players: { Row: Player; Insert: Partial<Player>; Update: Partial<Player> };
      budgets: { Row: Budget; Insert: Partial<Budget>; Update: Partial<Budget> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      games: { Row: Game; Insert: Partial<Game>; Update: Partial<Game> };
      player_payments: { Row: PlayerPayment; Insert: Partial<PlayerPayment>; Update: Partial<PlayerPayment> };
    };
    Enums: {
      expense_category: ExpenseCategory;
    };
  };
}
