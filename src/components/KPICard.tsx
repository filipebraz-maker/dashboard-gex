import clsx from "clsx";
import { LucideIcon, TrendingUp } from "lucide-react";

type Variant = "default" | "purple" | "cyan" | "green" | "orange";

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: string;
  icon?: LucideIcon;
  variant?: Variant;
}

export function KPICard({ label, value, delta, deltaColor, icon: Icon, variant = "default" }: KPICardProps) {
  const cardClass = {
    default: "card-elev",
    purple: "card-purple",
    cyan: "card-cyan",
    green: "card-green",
    orange: "card-orange",
  }[variant];

  const iconColor =
    variant === "purple"
      ? "var(--purple)"
      : variant === "cyan"
        ? "var(--cyan)"
        : variant === "green"
          ? "var(--green)"
          : variant === "orange"
            ? "var(--orange)"
            : "var(--text-dim)";

  return (
    <div className={clsx(cardClass, "px-4 md:px-5 py-4")}>
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] uppercase tracking-wider font-medium"
          style={{ color: "var(--text-dim)" }}
        >
          {label}
        </span>
        {Icon && (
          <div style={{ color: iconColor }}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-xl md:text-2xl lg:text-3xl font-semibold tabular leading-none mb-2 mono">{value}</div>
      {delta && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="w-3 h-3" style={{ color: deltaColor || "var(--text-dim)" }} />
          <span style={{ color: deltaColor || "var(--text-dim)" }} className="font-medium">{delta}</span>
        </div>
      )}
    </div>
  );
}
