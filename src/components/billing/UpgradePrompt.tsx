"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface Props {
  feature: string;
}

export function UpgradePrompt({ feature }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{feature} requires Pro</p>
        <p className="text-xs text-muted-foreground">Upgrade to unlock this feature.</p>
        <Button size="sm" onClick={handleUpgrade} disabled={loading}>
          {loading ? "Redirecting…" : "Upgrade to Pro"}
        </Button>
      </CardContent>
    </Card>
  );
}
