import clsx from "clsx";

interface Option {
  key: string;
  label: string;
}

interface Props {
  pathname: string;
  options: Option[];
  currentKey: string;
}

export function MesPills({ pathname, options, currentKey }: Props) {
  return (
    <div className="reveal flex flex-wrap items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
      {options.map((opt) => {
        const active = opt.key === currentKey;
        const href = opt.key === "todos" ? pathname : `${pathname}?mes=${opt.key}`;
        return (
          <a
            key={opt.key}
            href={href}
            className={clsx(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors no-underline",
              active ? "text-white" : "hover:bg-white/[0.04]"
            )}
            style={
              active
                ? {
                    background: "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(34, 211, 238, 0.12))",
                    border: "1px solid rgba(167, 139, 250, 0.3)",
                    color: "var(--text)",
                  }
                : { color: "var(--text-dim)" }
            }
          >
            {opt.label}
          </a>
        );
      })}
    </div>
  );
}
