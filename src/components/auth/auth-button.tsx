"use client";

import { LogIn, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as SbUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadGameState } from "@/lib/storage";

export function AuthButton() {
  const [user, setUser] = useState<SbUser | null>(null);
  const [configured] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [configured]);

  async function signIn() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  useEffect(() => {
    if (!user) return;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const state = loadGameState(today);
    if (!state || state.guesses.length === 0) return;
    void fetch("/api/me/sync-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: state.challengeId,
        date: state.date,
        guesses: state.guesses,
        status: state.status,
      }),
    });
  }, [user]);

  if (!configured) {
    return (
      <Button type="button" variant="ghost" size="default" disabled title="Configure Supabase to enable Google Auth">
        <User className="size-4" />
        Guest
      </Button>
    );
  }

  if (user) {
    return (
      <Button type="button" variant="ghost" size="default" onClick={signOut}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="default" onClick={signIn}>
      <LogIn className="size-4" />
      Google
    </Button>
  );
}
