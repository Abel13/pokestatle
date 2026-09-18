import { cn } from "@/lib/utils";

export function StatusLegend({ className }: { className?: string }) {
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
