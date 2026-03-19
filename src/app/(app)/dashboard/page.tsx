"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Team } from "@/types/database";

export default function DashboardPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupValues, setSetupValues] = useState({
    name: "",
    sport: "",
    season: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
  });
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();

      if (data) {
        setTeam(data as Team);
      } else {
        setShowSetup(true);
      }
      setIsLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("teams")
      .insert({
        owner_id: user.id,
        name: setupValues.name,
        sport: setupValues.sport || null,
        season: setupValues.season || null,
      })
      .select()
      .single();

    if (!error && data) {
      setTeam(data as Team);
      setShowSetup(false);
    }
    setIsSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="text-4xl">🏆</div>
            <h1 className="text-xl font-bold">Set Up Your Team</h1>
            <p className="text-sm text-muted-foreground">
              Tell us about your team to get started
            </p>
          </div>
          <form onSubmit={handleCreateTeam} className="space-y-3">
            <Input
              placeholder="Team name (e.g. Riverside FC)"
              value={setupValues.name}
              onChange={(e) => setSetupValues({ ...setupValues, name: e.target.value })}
              required
            />
            <Input
              placeholder="Sport (e.g. Soccer, Basketball)"
              value={setupValues.sport}
              onChange={(e) => setSetupValues({ ...setupValues, sport: e.target.value })}
            />
            <Input
              placeholder="Season (e.g. 2025-2026)"
              value={setupValues.season}
              onChange={(e) => setSetupValues({ ...setupValues, season: e.target.value })}
            />
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span className="font-semibold text-sm">{team.name}</span>
          {team.sport && (
            <span className="text-xs text-muted-foreground">· {team.sport}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs">
          Sign out
        </Button>
      </div>

      {/* Main split panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 min-w-[300px] overflow-hidden">
          <ChatPanel teamId={team.id} />
        </div>
        <div className="flex-1 overflow-hidden">
          <DashboardPanel teamId={team.id} teamName={team.name} />
        </div>
      </div>
    </div>
  );
}
