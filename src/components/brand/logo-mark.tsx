import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 shrink-0", className)}
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        className="fill-teal-600/15 stroke-teal-700 dark:fill-teal-400/15 dark:stroke-teal-300"
        strokeWidth="2"
      />
      <path
        d="M8 32a24 24 0 0 1 48 0"
        className="fill-teal-600 dark:fill-teal-400"
      />
      <path
        d="M56 32a24 24 0 0 1-48 0"
        className="fill-zinc-800 dark:fill-zinc-200"
      />
      <rect
        x="6"
        y="29.5"
        width="52"
        height="5"
        className="fill-background"
      />
      <circle
        cx="32"
        cy="32"
        r="7.5"
        className="fill-background stroke-zinc-800 dark:stroke-zinc-200"
        strokeWidth="3"
      />
      <circle cx="32" cy="32" r="3.2" className="fill-teal-600 dark:fill-teal-400" />
      {/* tiny stat bars */}
      <rect x="42" y="44" width="3.2" height="6" rx="1" className="fill-teal-600 dark:fill-teal-300" />
      <rect x="47" y="40.5" width="3.2" height="9.5" rx="1" className="fill-teal-600 dark:fill-teal-300" />
      <rect x="52" y="36.5" width="3.2" height="13.5" rx="1" className="fill-teal-600 dark:fill-teal-300" />
    </svg>
  );
}
