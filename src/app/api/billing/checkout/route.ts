import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import type { SubscriptionPlan } from "@/types/subscription";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const plan = body?.plan as SubscriptionPlan | undefined;
  if (plan !== "core" && plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId =
    plan === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID!
      : process.env.STRIPE_CORE_PRICE_ID!;

  // Look up existing Stripe customer ID
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = sub?.stripe_customer_id ?? null;

  // Create Stripe customer if not already on file
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=true`,
    cancel_url: `${baseUrl}/billing?canceled=true`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
