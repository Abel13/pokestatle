"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, BarChart3, History, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Play" },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/leaderboard", label: "Rank", icon: Trophy },
  { href: "/history", label: "History", icon: History },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="PokéStatle home"
        >
          <LogoMark className="size-8 transition-transform group-hover:scale-105" />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-300">
            PokéStatle
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                mounted &&
                  pathname === link.href &&
                  "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      <nav className="flex border-t border-border/50 sm:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground",
                mounted && pathname === link.href && "text-teal-700 dark:text-teal-300",
              )}
            >
              {link.href === "/" || !Icon ? (
                <>
                  <LogoMark className="size-4" />
                  <span>Play</span>
                </>
              ) : (
                <>
                  <Icon className="size-4" />
                  {link.label}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
