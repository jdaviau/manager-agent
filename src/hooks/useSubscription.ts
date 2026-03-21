"use client";

import { useState, useEffect } from "react";
import type { SubscriptionUsage, Subscription } from "@/types/subscription";

interface UseSubscriptionResult {
  subscription: Subscription | null;
  usage: { count: number; limit: number; year_month: string };
  isLoading: boolean;
  isPro: boolean;
  isActive: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean;
  refresh: () => void;
}

const DEFAULT_USAGE = { count: 0, limit: 50, year_month: "" };

export function useSubscription(): UseSubscriptionResult {
  const [data, setData] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((json: SubscriptionUsage) => {
        if (!cancelled) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]);

  const subscription = data?.subscription ?? null;
  const usage = data?.usage ?? DEFAULT_USAGE;
  const plan = subscription?.plan ?? "core";
  const status = subscription?.status ?? null;
  const isPro = plan === "pro" && status === "active";
  const isActive = status === "active" || status === "trialing";
  const isAtLimit = usage.count >= usage.limit;
  const isNearLimit = !isAtLimit && usage.count / usage.limit >= 0.8;

  return {
    subscription,
    usage,
    isLoading,
    isPro,
    isActive,
    isAtLimit,
    isNearLimit,
    refresh: () => setTick((t) => t + 1),
  };
}
