import clsx from "clsx";

type HeatColor = "cyan" | "purple" | "green" | "orange" | "blue" | "red" | "amber";

interface HeatBarProps {
  value: number;
  max?: number;
  color?: HeatColor;
  className?: string;
}

export function HeatBar({ value, max = 100, color = "cyan", className }: HeatBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={clsx("heat-bar", className)}>
      <div className={`h-full heat-fill-${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
