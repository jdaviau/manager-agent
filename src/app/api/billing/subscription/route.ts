import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import type { Subscription } from "@/types/subscription";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subRaw } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let sub = subRaw as Subscription | null;

  // Reconcile with Stripe to self-heal any missed webhooks
  if (sub?.stripe_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const stripeStatus = stripeSub.status as Subscription["status"];
      const periodEnd = stripeSub.items.data[0]?.current_period_end ?? 0;
      const stripePeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
      const stripeCancelAtEnd = stripeSub.cancel_at_period_end;

      if (
        sub.status !== stripeStatus ||
        sub.current_period_end !== stripePeriodEnd ||
        sub.cancel_at_period_end !== stripeCancelAtEnd
      ) {
        const { data: updated } = await supabase
          .from("subscriptions")
          .update({
            status: stripeStatus,
            current_period_end: stripePeriodEnd,
            cancel_at_period_end: stripeCancelAtEnd,
          })
          .eq("id", sub.id)
          .select()
          .single();
        if (updated) sub = updated as Subscription;
      }
    } catch {
      // Non-fatal — use DB value if Stripe call fails
    }
  }

  // Get current month usage
  const yearMonth = new Date().toISOString().slice(0, 7);
  const { data: usageRaw } = await supabase
    .from("prompt_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth)
    .maybeSingle();

  const count = usageRaw?.count ?? 0;
  const plan = sub?.plan ?? "core";
  const limit =
    plan === "pro"
      ? parseInt(process.env.PROMPT_LIMIT_PRO ?? "200")
      : parseInt(process.env.PROMPT_LIMIT_CORE ?? "50");

  return NextResponse.json({
    subscription: sub,
    usage: { count, limit, year_month: yearMonth },
  });
}
