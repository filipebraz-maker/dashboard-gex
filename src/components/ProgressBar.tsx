interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 100 ? "var(--green)" : pct >= 80 ? "var(--cyan)" : "var(--orange)";
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between text-xs font-medium mb-2" style={{ color: "var(--text-dim)" }}>
          <span>{label}</span>
          <span className="mono">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
