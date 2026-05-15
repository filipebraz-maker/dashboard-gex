import clsx from "clsx";

type PillTone = "neutral" | "cyan" | "purple" | "green" | "orange" | "red" | "amber";

const tones: Record<PillTone, { bg: string; color: string }> = {
  neutral: { bg: "rgba(148, 163, 184, 0.12)", color: "var(--text-dim)" },
  cyan: { bg: "rgba(34, 211, 238, 0.15)", color: "var(--cyan)" },
  purple: { bg: "rgba(167, 139, 250, 0.15)", color: "var(--purple)" },
  green: { bg: "rgba(52, 211, 153, 0.15)", color: "var(--green)" },
  orange: { bg: "rgba(251, 146, 60, 0.15)", color: "var(--orange)" },
  red: { bg: "rgba(248, 113, 113, 0.15)", color: "var(--red)" },
  amber: { bg: "rgba(251, 191, 36, 0.15)", color: "var(--amber)" },
};

interface PillProps {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}

export function Pill({ tone = "neutral", children, className }: PillProps) {
  const t = tones[tone];
  return (
    <span className={clsx("pill", className)} style={{ background: t.bg, color: t.color }}>
      {children}
    </span>
  );
}
