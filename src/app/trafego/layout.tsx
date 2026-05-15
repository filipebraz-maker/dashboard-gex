import { Calendar } from "lucide-react";
import { TrafegoTabs } from "@/components/TrafegoTabs";
import { carregarMetaAds, resumirMeta, contarPorCategoria } from "@/lib/meta-data";
import { formatBRL } from "@/lib/utils";
import type { AnuncioDia } from "@/lib/meta-types";

export const dynamic = "force-dynamic";

export default async function TrafegoLayout({ children }: { children: React.ReactNode }) {
  let linhas: AnuncioDia[] = [];
  try {
    linhas = await carregarMetaAds();
  } catch {
    linhas = [];
  }
  const r = resumirMeta(linhas);
  const contadores = contarPorCategoria(linhas);
  const periodo = r.diaIni && r.diaFim
    ? `${r.diaIni.toLocaleDateString("pt-BR")} → ${r.diaFim.toLocaleDateString("pt-BR")}`
    : "—";

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Tráfego</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Meta Ads · {formatBRL(r.investimentoTotal)} investidos · Capt. {contadores.captacao.campanhas} · Atr. {contadores.atracao.campanhas} · Cont. {contadores.conteudo.campanhas} · Out. {contadores.outros.campanhas}
          </p>
        </div>
        <div className="flex items-center gap-2 card px-3 py-2 text-sm">
          <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-dim)" }} />
          <span className="mono">{periodo}</span>
        </div>
      </header>

      <TrafegoTabs />

      {children}
    </div>
  );
}
