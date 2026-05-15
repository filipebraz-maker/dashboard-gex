import clsx from "clsx";

interface SectionCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "purple" | "cyan" | "green" | "orange";
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, action, children, className, variant = "default", noPadding }: SectionCardProps) {
  const variantClass = {
    default: "card",
    purple: "card-purple",
    cyan: "card-cyan",
    green: "card-green",
    orange: "card-orange",
  }[variant];

  return (
    <div className={clsx(variantClass, !noPadding && "px-4 md:px-5 py-4", "h-full", className)}>
      <div className={clsx("flex items-baseline justify-between gap-2", !noPadding ? "mb-4" : "px-4 md:px-5 pt-4 pb-3")}>
        <div>
          <div className="text-sm font-semibold leading-tight">{title}</div>
          {subtitle && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-dim)" }}>{subtitle}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
