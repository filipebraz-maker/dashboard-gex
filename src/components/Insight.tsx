import clsx from "clsx";
import { Lightbulb, AlertTriangle, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

type Variant = "insight" | "warning" | "success" | "danger";

const variants: Record<Variant, { bg: string; border: string; iconColor: string; icon: LucideIcon }> = {
  insight: {
    bg: "rgba(34, 211, 238, 0.06)",
    border: "rgba(34, 211, 238, 0.3)",
    iconColor: "var(--cyan)",
    icon: Lightbulb,
  },
  warning: {
    bg: "rgba(251, 146, 60, 0.08)",
    border: "rgba(251, 146, 60, 0.3)",
    iconColor: "var(--orange)",
    icon: AlertTriangle,
  },
  success: {
    bg: "rgba(52, 211, 153, 0.08)",
    border: "rgba(52, 211, 153, 0.3)",
    iconColor: "var(--green)",
    icon: CheckCircle2,
  },
  danger: {
    bg: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.3)",
    iconColor: "var(--red)",
    icon: XCircle,
  },
};

interface InsightProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Insight({ variant = "insight", title, children, className }: InsightProps) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div
      className={clsx("rounded-lg p-4 text-sm", className)}
      style={{ background: v.bg, border: `1px solid ${v.border}` }}
    >
      <div className="flex gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: v.iconColor }} />
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="leading-relaxed" style={{ color: "var(--text)" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
