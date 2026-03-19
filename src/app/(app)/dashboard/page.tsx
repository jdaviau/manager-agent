"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, LayoutDashboard, LogOut } from "lucide-react";
import type { Team } from "@/types/database";

export default function DashboardPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard">("chat");
  const [setupValues, setSetupValues] = useState({
    name: "",
    sport: "",
    season: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
  });
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
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

    const { data: { user } } = await supabase.auth.getUser();
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your team...</p>
        </div>
      </div>
    );
  }

  // Team setup
  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white text-2xl mb-4 shadow-md">
              🏆
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Set Up Your Team</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us about your team to get started
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-5">
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Team name</label>
                <Input
                  placeholder="e.g. Riverside FC"
                  value={setupValues.name}
                  onChange={(e) => setSetupValues({ ...setupValues, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Sport</label>
                <Input
                  placeholder="e.g. Soccer, Basketball"
                  value={setupValues.sport}
                  onChange={(e) => setSetupValues({ ...setupValues, sport: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Season</label>
                <Input
                  placeholder="e.g. 2026-2027"
                  value={setupValues.season}
                  onChange={(e) => setSetupValues({ ...setupValues, season: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full mt-1" disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Team"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-white shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
            🏆
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm">{team.name}</span>
            {team.sport && (
              <span className="hidden sm:inline text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {team.sport}
              </span>
            )}
            {team.season && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {team.season}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Sign out</span>
        </Button>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop: side-by-side */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <div className="w-[420px] shrink-0 overflow-hidden border-r">
            <ChatPanel teamId={team.id} />
          </div>
          <div className="flex-1 overflow-hidden">
            <DashboardPanel teamId={team.id} />
          </div>
        </div>

        {/* Mobile/tablet: single active panel */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {activeTab === "chat" ? (
            <ChatPanel teamId={team.id} />
          ) : (
            <DashboardPanel teamId={team.id} />
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden flex border-t bg-white shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === "chat"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className={`h-5 w-5 ${activeTab === "chat" ? "stroke-[2.5]" : ""}`} />
          <span>Chat</span>
          {activeTab === "chat" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors relative ${
            activeTab === "dashboard"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 ${activeTab === "dashboard" ? "stroke-[2.5]" : ""}`} />
          <span>Dashboard</span>
          {activeTab === "dashboard" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </nav>
    </div>
  );
}
