"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { loadLocalStats } from "@/lib/storage";

type HistoryItem = {
  challengeId: number;
  date: string;
  difficulty: string;
  status: string;
  guesses: number[];
  completedAt: string | null;
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestNote, setGuestNote] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/me/history");
        if (res.ok) {
          setItems(await res.json());
          return;
        }
        const local = loadLocalStats();
        setGuestNote(
          local.played
            ? `Guest mode: ${local.played} games tracked in this browser. Sign in to sync history across devices.`
            : "Sign in with Google to keep a cross-device history. Guest progress stays in this browser.",
        );
      } catch {
        setGuestNote("Sign in with Google to view history.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <History className="size-7 text-teal-600 dark:text-teal-300" />
          History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Past daily challenges you completed while signed in.
        </p>
      </div>

      {loading ? <Skeleton className="h-40 w-full" /> : null}
      {guestNote ? (
        <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
          {guestNote}
        </div>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.challengeId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors"
            onClick={() => window.location.href = `/?date=${item.date}`}
          >
            <div>
              <p className="font-medium">
                #{item.challengeId} · {item.date}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.guesses.length} guess
                {item.guesses.length === 1 ? "" : "es"}
                {item.completedAt
                  ? ` · ${new Date(item.completedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.difficulty}</Badge>
              <Badge
                variant={item.status === "WON" ? "default" : "secondary"}
              >
                {item.status}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
