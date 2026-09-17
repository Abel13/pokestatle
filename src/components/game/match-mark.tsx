"use client";

import { cn } from "@/lib/utils";

export function MatchMark({
  matched,
  label,
  children,
  className,
}: {
  matched: boolean;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const caption = matched ? `${label} (match)` : `${label} (no match)`;

  return (
    <span
      className={cn(
        "relative inline-flex",
        !matched && "opacity-45 grayscale",
        className,
      )}
      title={caption}
      aria-label={caption}
    >
      {children}
      {matched ? (
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      ) : (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-0.5 w-5 rotate-[-28deg] rounded-full bg-background/90 shadow" />
        </span>
      )}
    </span>
  );
}
