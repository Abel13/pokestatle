import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const STAT_KINDS = [
  "generation",
  "height",
  "weight",
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
] as const;

export type StatKind = (typeof STAT_KINDS)[number];

export const STAT_LABELS: Record<StatKind, string> = {
  generation: "Generation",
  height: "Height",
  weight: "Weight",
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
};

export const STAT_UNITS: Partial<Record<StatKind, string>> = {
  height: "m",
  weight: "kg",
};

function IconFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("size-4 shrink-0", className)}
      role="img"
      aria-hidden
    >
      <title>{title}</title>
      {children}
    </svg>
  );
}

function GenerationIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.generation} className={className}>
      <rect
        x="2.2"
        y="1.6"
        width="11.6"
        height="12.8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="4.1"
        y="3.4"
        width="7.8"
        height="5.2"
        rx="1"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="5.6" cy="11.7" r="0.9" fill="currentColor" />
      <rect
        x="7.6"
        y="11"
        width="4.2"
        height="1.4"
        rx="0.6"
        fill="currentColor"
        fillOpacity="0.75"
      />
    </IconFrame>
  );
}

function HeightIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.height} className={className}>
      <path
        d="M3.2 2.2v11.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M2.1 2.4h2.2M2.1 13.4h2.2M2.4 5.2h1.4M2.4 8h1.4M2.4 10.8h1.4"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M8.2 13.4V6.4c0-1.3 1-2.2 2.2-2.2s2.2.9 2.2 2.2v7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10.4" cy="3.1" r="1.25" fill="currentColor" />
    </IconFrame>
  );
}

function WeightIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.weight} className={className}>
      <path
        d="M8 2.2v2.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="2.4" r="1.05" fill="currentColor" />
      <path
        d="M3.2 5.1h9.6l-1.3 8.2H4.5L3.2 5.1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 8.1h3.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

function HpIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.hp} className={className}>
      <circle cx="8" cy="8" r="6.1" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 5v6M5 8h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

function AttackIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.attack} className={className}>
      <path
        d="M12.8 3.2 7.1 8.9"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M10.7 3.1h2.2v2.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.2 9.6l2.2 2.2M3.4 12.6l2.4-.3M3.7 10.4l-.3 2.4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

function DefenseIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.defense} className={className}>
      <path
        d="M8 2.3 13.2 4.4v4.3c0 3.1-2.1 4.9-5.2 5.9-3.1-1-5.2-2.8-5.2-5.9V4.4L8 2.3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.4v4.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

function SpecialAttackIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.specialAttack} className={className}>
      <path
        d="M8 1.6 9.4 6.6 14.4 8 9.4 9.4 8 14.4 6.6 9.4 1.6 8 6.6 6.6 8 1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

function SpecialDefenseIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.specialDefense} className={className}>
      <path
        d="M8 2.3 13.1 5.2 11.2 13.4H4.8L2.9 5.2 8 2.3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.8 8.7 7.4 10.4 7.6 9.1 8.8 9.5 10.5 8 9.6 6.5 10.5 6.9 8.8 5.6 7.6 7.3 7.4 8 5.8Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

function SpeedIcon({ className }: { className?: string }) {
  return (
    <IconFrame title={STAT_LABELS.speed} className={className}>
      <path
        d="M3.1 4.4h4.4M2.4 8h3.8M3.1 11.6h4.4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M8.2 3.1 13.4 8 8.2 12.9"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

const ICONS: Record<StatKind, (props: { className?: string }) => ReactNode> =
  {
    generation: GenerationIcon,
    height: HeightIcon,
    weight: WeightIcon,
    hp: HpIcon,
    attack: AttackIcon,
    defense: DefenseIcon,
    specialAttack: SpecialAttackIcon,
    specialDefense: SpecialDefenseIcon,
    speed: SpeedIcon,
  };

export function StatIcon({
  kind,
  className,
}: {
  kind: StatKind;
  className?: string;
}) {
  const Icon = ICONS[kind];
  return <Icon className={className} />;
}
