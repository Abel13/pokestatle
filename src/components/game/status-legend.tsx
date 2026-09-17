import { cn } from "@/lib/utils";

export function StatusLegend({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p
        className={cn(
          "text-[10px] leading-snug text-muted-foreground",
          className,
        )}
      >
        <span className="block">🟩 exact · 🟨 ≤10% · 🟧 ≤25%</span>
        <span className="block">⬆️ higher · ⬇️ lower · ⬛ types miss</span>
      </p>
    );
  }

  return (
    <p
      className={cn(
        "text-center text-[11px] leading-snug text-muted-foreground sm:text-xs",
        className,
      )}
    >
      Close → color: 🟩 exact · 🟨 ≤10% · 🟧 ≤25%
      <br />
      Far → direction: ⬆️ higher · ⬇️ lower · ⬛ types miss
    </p>
  );
}
