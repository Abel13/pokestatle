"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

type IconProps = {
  className?: string;
  title?: string;
};

function SvgShell({
  className,
  title,
  children,
  color,
}: IconProps & { children: ReactNode; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-5 shrink-0", className)}
      role="img"
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="11" fill={color} />
      {children}
    </svg>
  );
}

const icons: Record<string, (props: IconProps) => ReactNode> = {
  normal: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.normal!} title={p.title ?? "Normal"}>
      <circle cx="12" cy="12" r="4.2" fill="#fff" fillOpacity={0.95} />
    </SvgShell>
  ),
  fire: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.fire!} title={p.title ?? "Fire"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 5.2c1.6 2.2.6 3.6.6 5.1 0 1.5 1.3 2.1 1.3 3.5 0 2-1.6 3.4-3.9 3.4S6.2 15.8 6.2 13.8c0-1.4 1.2-2 1.2-3.5 0-1.7-1.1-3.1.6-5.1 1.1 1.4 2.4 1.4 4 0z"
      />
    </SvgShell>
  ),
  water: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.water!} title={p.title ?? "Water"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 4.8c2.8 3.4 5.2 5.9 5.2 8.4A5.2 5.2 0 0 1 12 18.4a5.2 5.2 0 0 1-5.2-5.2c0-2.5 2.4-5 5.2-8.4z"
      />
    </SvgShell>
  ),
  electric: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.electric!} title={p.title ?? "Electric"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M13.8 4.5 8.2 13h3.1l-1.4 6.5 6.2-9.2h-3.2z"
      />
    </SvgShell>
  ),
  grass: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.grass!} title={p.title ?? "Grass"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 5c3.8 1.2 5.8 3.8 6 7.2-2.1-.4-3.8.1-5.2 1.3C11.4 9.8 9.4 7.4 6 6.2 7.2 8.8 8 11.4 8 14c0 2.4 1.7 4 4 4s4-1.6 4-4c0-1.2-.2-2.3-.7-3.4C16.8 8.4 15 6.4 12 5z"
      />
    </SvgShell>
  ),
  ice: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.ice!} title={p.title ?? "Ice"}>
      <path
        d="M12 5v14M6.5 7.8l11 8.4M17.5 7.8l-11 8.4"
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="#fff" />
    </SvgShell>
  ),
  fighting: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.fighting!} title={p.title ?? "Fighting"}>
      <path fill="#fff" fillOpacity={0.95} d="M8.2 8.2h2.2v7.6H8.2zm5.4 0h2.2v7.6h-2.2zM10 6.5h4v1.7h-4z" />
    </SvgShell>
  ),
  poison: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.poison!} title={p.title ?? "Poison"}>
      <circle cx="9.2" cy="10.2" r="2.4" fill="#fff" fillOpacity={0.95} />
      <circle cx="14.8" cy="10.2" r="2.4" fill="#fff" fillOpacity={0.95} />
      <circle cx="12" cy="15.2" r="2.6" fill="#fff" fillOpacity={0.95} />
    </SvgShell>
  ),
  ground: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.ground!} title={p.title ?? "Ground"}>
      <path fill="#fff" fillOpacity={0.95} d="M4.8 15.5 8.5 8.2h7l3.7 7.3z" />
    </SvgShell>
  ),
  flying: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.flying!} title={p.title ?? "Flying"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M5 13.5c3.2-1 5.4-3.8 6.2-7.2.8 3.4 3 6.2 6.2 7.2-2.6.8-4.5 2.4-6.2 4.8-1.7-2.4-3.6-4-6.2-4.8z"
      />
    </SvgShell>
  ),
  psychic: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.psychic!} title={p.title ?? "Psychic"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 5.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zm0 2.4a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 2.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z"
      />
    </SvgShell>
  ),
  bug: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.bug!} title={p.title ?? "Bug"}>
      <ellipse cx="12" cy="12.4" rx="4.2" ry="5" fill="#fff" fillOpacity={0.95} />
      <path
        d="M8.2 7.2 6 5.4M15.8 7.2 18 5.4M7 12H4.5M17 12h2.5M8.2 16.8 6 18.4M15.8 16.8 18 18.4"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </SvgShell>
  ),
  rock: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.rock!} title={p.title ?? "Rock"}>
      <path fill="#fff" fillOpacity={0.95} d="M8.2 7.2h6.4L17.5 12l-2.9 4.8H8.2L5.5 12z" />
    </SvgShell>
  ),
  ghost: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.ghost!} title={p.title ?? "Ghost"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 5.2c-3.2 0-5.4 2.2-5.4 5.4v7.2l1.8-1.3 1.7 1.3 1.9-1.3 1.9 1.3 1.7-1.3 1.8 1.3v-7.2c0-3.2-2.2-5.4-5.4-5.4z"
      />
      <circle cx="9.8" cy="11" r="1.1" fill={TYPE_COLORS.ghost} />
      <circle cx="14.2" cy="11" r="1.1" fill={TYPE_COLORS.ghost} />
    </SvgShell>
  ),
  dragon: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.dragon!} title={p.title ?? "Dragon"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M7.2 15.8c0-4.4 2.1-7.2 4.8-9.6 2.7 2.4 4.8 5.2 4.8 9.6 0 1.4-1 2.5-2.4 2.5-.8 0-1.5-.4-2.4-1.2-.9.8-1.6 1.2-2.4 1.2-1.4 0-2.4-1.1-2.4-2.5z"
      />
    </SvgShell>
  ),
  dark: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.dark!} title={p.title ?? "Dark"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M13.8 5.2A6.8 6.8 0 1 0 18 14.5 5.4 5.4 0 0 1 13.8 5.2z"
      />
    </SvgShell>
  ),
  steel: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.steel!} title={p.title ?? "Steel"}>
      <path fill="#fff" fillOpacity={0.95} d="M12 4.8 18.4 12 12 19.2 5.6 12z" />
      <path d="M12 8.2 15.4 12 12 15.8 8.6 12z" fill={TYPE_COLORS.steel} fillOpacity={0.45} />
    </SvgShell>
  ),
  fairy: (p) => (
    <SvgShell {...p} color={TYPE_COLORS.fairy!} title={p.title ?? "Fairy"}>
      <path
        fill="#fff"
        fillOpacity={0.95}
        d="M12 4.8 13.2 10h5.2l-4.2 3.1 1.6 5.1L12 15.4l-3.8 2.8 1.6-5.1-4.2-3.1h5.2z"
      />
    </SvgShell>
  ),
};

export function TypeIcon({
  type,
  className,
  matched,
}: {
  type: string;
  className?: string;
  matched?: boolean;
}) {
  const key = type.toLowerCase();
  const Icon = icons[key] ?? icons.normal!;
  return (
    <span
      className={cn(
        "relative inline-flex",
        matched === false && "opacity-45 grayscale",
        className,
      )}
      title={matched === false ? `${type} (no match)` : matched ? `${type} (match)` : type}
    >
      {Icon({ className: "size-6", title: type })}
      {matched === true ? (
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      ) : null}
      {matched === false ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-0.5 w-5 rotate-[-28deg] rounded-full bg-background/90 shadow" />
        </span>
      ) : null}
    </span>
  );
}
