"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingCart, Megaphone, Sparkles, CalendarDays, Menu, X, Zap } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/trafego", label: "Tráfego", icon: Megaphone },
  { href: "/atracao", label: "Atração", icon: Sparkles },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/relatorio", label: "Relatório Diário", icon: CalendarDays },
];

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
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
            <Icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const header = (
    <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))" }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-base font-semibold leading-none">Gex</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>Dashboard</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col"
        style={{ background: "var(--bg-elev)", borderRight: "1px solid var(--border)" }}
      >
        {header}
        <NavLinks pathname={pathname} />
      </aside>

      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--bg-elev)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))" }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-sm font-semibold leading-none">Gex Dashboard</div>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-md hover:bg-white/[0.04]" style={{ color: "var(--text-dim)" }} aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-full flex flex-col shadow-xl" style={{ background: "var(--bg-elev)" }}>
            <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))" }}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-base font-semibold leading-none">Gex</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>Dashboard</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-white/[0.04]" style={{ color: "var(--text-dim)" }} aria-label="Fechar menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
