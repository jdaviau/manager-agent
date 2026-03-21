import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Service role client — only acceptable in webhook handler (no user session)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserIdForEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
): Promise<string | null> {
  // Prefer user_id from checkout session metadata
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.user_id ?? null;
  }

  // For subscription events, look up via stripe_customer_id
  const obj = event.data.object as { customer?: string | null };
  const customerId = typeof obj.customer === "string" ? obj.customer : null;
  if (!customerId) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[webhook] ❌ Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log("[webhook] Event:", event.type);
  const supabase = getServiceClient();
  const userId = await getUserIdForEvent(event, supabase);

  if (!userId && event.type !== "invoice.payment_failed") {
    console.warn("[webhook] No user_id resolved for event:", event.type);
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = session.metadata?.plan ?? "core";
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId!,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: "active",
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      if (!userId) break;
      const periodEnd = sub.items.data[0]?.current_period_end ?? 0;
      await supabase
        .from("subscriptions")
        .update({
          status: sub.status as string,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      if (!userId) break;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", userId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      // Ignore other event types
      break;
  }

  return NextResponse.json({ received: true });
}
