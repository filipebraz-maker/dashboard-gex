"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import clsx from "clsx";

interface Option {
  key: string;
  label: string;
}

interface Props {
  options: Option[];
  currentKey: string;
  currentLabel?: string;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MesSelector({ options, currentKey, currentLabel }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initFim = searchParams.get("ate") || toISO(new Date());
  const initInicio = (() => {
    const fromUrl = searchParams.get("de");
    if (fromUrl) return fromUrl;
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISO(d);
  })();
  const [de, setDe] = useState(initInicio);
  const [ate, setAte] = useState(initFim);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = options.find((o) => o.key === currentKey);
  const displayLabel = currentLabel || currentOption?.label || "Selecionar período";

  // Constrói href absoluto pra cada opção (preserva outros params que não sejam mes/de/ate)
  function hrefPara(key: string): string {
    const params = new URLSearchParams();
    searchParams.forEach((v, k) => {
      if (k !== "mes" && k !== "de" && k !== "ate") params.set(k, v);
    });
    if (key !== "todos") params.set("mes", key);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 card px-3 py-2 text-sm font-medium transition-colors"
      >
        <Calendar className="w-4 h-4" style={{ color: "var(--text-dim)" }} />
        <span>{displayLabel}</span>
        <ChevronDown className={clsx("w-4 h-4 transition-transform", open && "rotate-180")} style={{ color: "var(--text-dim)" }} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 z-50 w-64 rounded-lg shadow-2xl py-1"
          style={{ backgroundColor: "var(--card-hover)", border: "1px solid var(--border)" }}
        >
          {options.map((opt) => {
            const selected = opt.key === currentKey;
            // Plain <a> tag → full browser navigation, sem cache do Next
            return (
              <a
                key={opt.key}
                href={hrefPara(opt.key)}
                className="block w-full text-left px-3 py-2 text-sm transition-colors no-underline"
                style={
                  selected
                    ? {
                        background: "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(34, 211, 238, 0.12))",
                        color: "var(--text)",
                        fontWeight: 500,
                      }
                    : { color: "var(--text-dim)" }
                }
              >
                {opt.label}
              </a>
            );
          })}

          <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />

          <button
            type="button"
            onClick={() => setCustomMode((v) => !v)}
            className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between"
            style={
              currentKey === "custom"
                ? {
                    background: "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(34, 211, 238, 0.12))",
                    color: "var(--text)",
                    fontWeight: 500,
                  }
                : { color: "var(--text-dim)" }
            }
          >
            <span>Personalizado</span>
            <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", customMode && "rotate-180")} />
          </button>

          {customMode && (
            <form
              method="get"
              action={pathname}
              className="px-3 py-3 space-y-2.5"
              style={{ background: "var(--bg-elev)", borderTop: "1px solid var(--border)" }}
            >
              <input type="hidden" name="mes" value="custom" />
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-dim)" }}>De</label>
                <input
                  type="date"
                  name="de"
                  value={de}
                  max={ate}
                  onChange={(e) => setDe(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded mono"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-dim)" }}>Até</label>
                <input
                  type="date"
                  name="ate"
                  value={ate}
                  min={de}
                  onChange={(e) => setAte(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded mono"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
                />
              </div>
              <button
                type="submit"
                disabled={!de || !ate || de > ate}
                className="w-full px-3 py-2 text-sm font-medium rounded transition-opacity disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--purple), var(--cyan))", color: "white" }}
              >
                Aplicar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
