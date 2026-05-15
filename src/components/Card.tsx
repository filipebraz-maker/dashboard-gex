import clsx from "clsx";

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, className }: CardProps) {
  return (
    <div className={clsx("card px-4 md:px-5 py-4", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {subtitle && (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-dim)" }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
