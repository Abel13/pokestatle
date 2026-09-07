import { Coffee } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>Daily Pokémon guessing — data synced from PokéAPI.</p>
        <a
          href="https://buymeacoffee.com/abeldutraui"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-foreground transition hover:border-teal-500/50 hover:text-teal-700 dark:hover:text-teal-300"
        >
          <Coffee className="size-4" />
          Buy me a coffee
        </a>
      </div>
    </footer>
  );
}
