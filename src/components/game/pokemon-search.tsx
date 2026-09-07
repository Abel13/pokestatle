"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchItem = {
  id: number;
  name: string;
  sprite: string;
  types: string[];
};

export function PokemonSearch({
  disabled,
  excludeIds,
  onSelect,
}: {
  disabled?: boolean;
  excludeIds: number[];
  onSelect: (pokemon: SearchItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/pokemon/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SearchItem[];
        const filtered = data.filter((p) => !excludeIds.includes(p.id));
        setItems(filtered);
        setOpen(true);
        setActive(0);
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, excludeIds]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(item: SearchItem) {
    onSelect(item);
    setQuery("");
    setItems([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          disabled={disabled}
          placeholder="Search a Pokémon..."
          className="h-11 rounded-xl border-border/80 bg-background/80 pl-10 pr-10 text-sm shadow-sm transition focus-visible:ring-teal-500/40 sm:h-12 sm:text-base"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || items.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              const item = items[active];
              if (item) choose(item);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading ? (
          <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {open && items.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border/80 bg-popover p-1 shadow-lg"
        >
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted",
                  index === active && "bg-muted",
                )}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
              >
                {item.sprite ? (
                  <Image
                    src={item.sprite}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="size-8 rounded bg-muted" />
                )}
                <span className="font-medium">{item.name}</span>
                <span className="ml-auto text-[11px] capitalize text-muted-foreground">
                  {item.types.join(" / ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
