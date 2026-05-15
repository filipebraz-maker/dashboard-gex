"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Calendar } from "lucide-react";
import clsx from "clsx";

interface Props {
  mes: string;
  meses: string[];
}

function paraUrl(mes: string): string {
  return mes.replace(/\//g, "");
}

export function MesSelector({ mes, meses }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function hrefPara(novoMes: string): string {
    const params = new URLSearchParams(searchParams.toString());
    if (novoMes === "TODOS") params.delete("mes");
    else params.set("mes", paraUrl(novoMes));
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  const opcoes = ["TODOS", ...meses];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 card px-3 py-2 text-sm hover:opacity-90 transition-opacity"
      >
        <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-dim)" }} />
        <span className="mono">{mes === "TODOS" ? "Todos os meses" : mes}</span>
        <ChevronDown
          className={clsx("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
          style={{ color: "var(--text-dim)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-lg shadow-2xl py-1 min-w-[180px]"
          style={{ backgroundColor: "var(--card-hover)", border: "1px solid var(--border)" }}
        >
          {opcoes.map((opt) => {
            const ativo = opt === mes || (opt === "TODOS" && mes === "TODOS");
            // Plain <a> tag forces full browser navigation — bypasses Next router cache.
            return (
              <a
                key={opt}
                href={hrefPara(opt)}
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/[0.04] flex items-center justify-between gap-2 mono"
                style={ativo ? { color: "var(--text)" } : { color: "var(--text-dim)" }}
              >
                <span>{opt === "TODOS" ? "Todos os meses" : opt}</span>
                {ativo && <Check className="w-4 h-4" style={{ color: "var(--cyan)" }} />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
