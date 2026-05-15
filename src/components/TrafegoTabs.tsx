"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [
  { href: "/trafego", label: "Geral" },
  { href: "/trafego/captacao", label: "Captação" },
  { href: "/trafego/atracao", label: "Atração" },
  { href: "/trafego/conteudo", label: "Conteúdo" },
  { href: "/trafego/outros", label: "Outros" },
];

export function TrafegoTabs() {
  const pathname = usePathname();
  return (
    <nav className="reveal mb-5 flex flex-wrap items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
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
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
