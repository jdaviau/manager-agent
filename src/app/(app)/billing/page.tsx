"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

function UsageMeter({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min((count / limit) * 100, 100);
  const color =
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{count} / {limit} prompts used this month</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const variant =
    status === "active" || status === "trialing"
      ? "default"
      : status === "past_due"
      ? "destructive"
      : "secondary";
  return <Badge variant={variant} className="capitalize">{status.replace("_", " ")}</Badge>;
}

export default function BillingPage() {
  const { subscription, usage, isLoading, isPro, isActive } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<"core" | "pro" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleCheckout(plan: "core" | "pro") {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } finally {
      setPortalLoading(false);
    }
  }

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your subscription and usage.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Current plan card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription>Current plan</CardDescription>
                    <CardTitle className="capitalize mt-1">
                      {subscription ? subscription.plan : "No active plan"}
                    </CardTitle>
                  </div>
                  {statusBadge(subscription?.status ?? null)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <UsageMeter count={usage.count} limit={usage.limit} />

                {renewalDate && (
                  <p className="text-xs text-muted-foreground">
                    {subscription?.cancel_at_period_end
                      ? `Cancels on ${renewalDate}`
                      : `Renews on ${renewalDate}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePortal}
                      disabled={portalLoading}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      {portalLoading ? "Opening…" : "Manage billing"}
                    </Button>
                  )}

                  {/* No subscription: show Subscribe to Core + Subscribe to Pro */}
                  {!subscription && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckout("core")}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === "core" ? "Redirecting…" : "Subscribe to Core"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCheckout("pro")}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === "pro" ? "Redirecting…" : "Subscribe to Pro"}
                      </Button>
                    </>
                  )}

                  {/* Core subscriber: show Upgrade to Pro */}
                  {subscription?.plan === "core" && isActive && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckout("pro")}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
                    </Button>
                  )}

                  {/* Pro subscriber: show Downgrade to Core */}
                  {subscription?.plan === "pro" && isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckout("core")}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === "core" ? "Redirecting…" : "Downgrade to Core"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold">Core</p>
                    <p className="text-xs text-muted-foreground">Player & roster management, budget tracking, game scheduling, expense logging, payment tracking.</p>
                    <p className="text-xs font-medium tabular-nums">50 prompts / month</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold">Pro</p>
                    <p className="text-xs text-muted-foreground">Everything in Core, plus upcoming Pro features.</p>
                    <p className="text-xs font-medium tabular-nums">200 prompts / month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
