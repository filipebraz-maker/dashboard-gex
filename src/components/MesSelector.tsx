"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
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

  function navegar(qs: string) {
    setOpen(false);
    setCustomMode(false);
    const url = qs ? `${pathname}?${qs}` : pathname;
    // Navegação nativa garantida + startTransition pro caso do Next conseguir suave
    startTransition(() => {
      router.push(url);
      // Garante re-fetch do server component
      window.setTimeout(() => router.refresh(), 0);
    });
  }

  function selectPreset(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("de");
    params.delete("ate");
    if (key === "todos") params.delete("mes");
    else params.set("mes", key);
    navegar(params.toString());
  }

  function aplicarCustom() {
    if (!de || !ate || de > ate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", "custom");
    params.set("de", de);
    params.set("ate", ate);
    navegar(params.toString());
  }

  const currentOption = options.find((o) => o.key === currentKey);
  const displayLabel = currentLabel || currentOption?.label || "Selecionar período";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx("flex items-center gap-2 card px-3 py-2 text-sm font-medium transition-colors", isPending && "opacity-50")}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-dim)" }} />
        ) : (
          <Calendar className="w-4 h-4" style={{ color: "var(--text-dim)" }} />
        )}
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
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectPreset(opt.key)}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
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
              </button>
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
            <div className="px-3 py-3 space-y-2.5" style={{ background: "var(--bg-elev)", borderTop: "1px solid var(--border)" }}>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: "var(--text-dim)" }}>De</label>
                <input
                  type="date"
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
                  value={ate}
                  min={de}
                  onChange={(e) => setAte(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded mono"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
                />
              </div>
              <button
                type="button"
                onClick={aplicarCustom}
                disabled={!de || !ate || de > ate}
                className="w-full px-3 py-2 text-sm font-medium rounded transition-opacity disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--purple), var(--cyan))", color: "white" }}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
