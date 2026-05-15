interface FunnelRowProps {
  label: string;
  value: string;
  pairLabel?: string;
  pairValue?: string;
  highlight?: boolean;
}

export function FunnelRow({ label, value, pairLabel, pairValue, highlight = false }: FunnelRowProps) {
  return (
    <div className="flex items-stretch gap-2">
      <div
        className="flex-1 rounded-lg px-3 py-2.5 flex items-center justify-between"
        style={{
          background: highlight
            ? "linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(167, 139, 250, 0.04))"
            : "var(--bg-elev)",
          border: highlight ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid var(--border-soft)",
        }}
      >
        <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
        <span className="text-base font-semibold mono">{value}</span>
      </div>
      {pairLabel && pairValue && (
        <div
          className="rounded-lg px-3 py-2.5 flex flex-col items-center justify-center min-w-[110px]"
          style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(34, 211, 238, 0.04))",
            border: "1px solid rgba(34, 211, 238, 0.25)",
          }}
        >
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--cyan)" }}>
            {pairLabel}
          </span>
          <span className="text-sm font-semibold mono" style={{ color: "var(--cyan)" }}>
            {pairValue}
          </span>
        </div>
      )}
    </div>
  );
}
