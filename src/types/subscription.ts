export type SubscriptionPlan = "core" | "pro";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptUsage {
  id: string;
  user_id: string;
  year_month: string;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  subscription: Subscription | null;
  usage: {
    count: number;
    limit: number;
    year_month: string;
  };
}
