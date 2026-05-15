import { DollarSign, ShoppingCart, Users, TrendingDown, Clock, Percent, Target, Megaphone, Sparkles } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  carregarLeadsDiarios,
  filtrarPorMes,
  filtrarLeadsPorMes,
  resumir,
  MESES_VENDAS,
} from "@/lib/gex-data";
import { carregarMetaAds, resumirMeta } from "@/lib/meta-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

const MES_INDEX: Record<string, number> = { "JAN/26": 0, "FEV/26": 1, "MAR/26": 2, "ABR/26": 3, "MAIO/26": 4 };

function filtrarMetaPorMes<T extends { dia: Date }>(linhas: T[], mes: string): T[] {
  if (mes === "TODOS") return linhas;
  const idx = MES_INDEX[mes];
  if (idx === undefined) return linhas;
  return linhas.filter((l) => l.dia.getMonth() === idx && l.dia.getFullYear() === 2026);
}

export default async function Home({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? "TODOS";

  const [vendas, leads, meta] = await Promise.all([
    carregarVendas(),
    carregarLeadsDiarios(),
    carregarMetaAds(),
  ]);
  const vendasFiltradas = filtrarPorMes(vendas, mes);
  const leadsFiltrados = filtrarLeadsPorMes(leads, mes);
  const metaFiltrada = filtrarMetaPorMes(meta, mes);
  const r = resumir(vendasFiltradas, leadsFiltrados);
  const rMeta = resumirMeta(metaFiltrada);

  const roas = rMeta.investimentoTotal > 0 ? r.faturamentoLiquido / rMeta.investimentoTotal : 0;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Visão Geral</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {mes === "TODOS" ? "Todos os meses" : mes} · {r.qtdVendasLiquidas} venda(s) · {formatNumber(r.totalLeads)} lead(s)
          </p>
        </div>
        <MesSelector mes={mes} meses={MESES_VENDAS.map((m) => m.rotulo)} />
      </header>

      <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>Vendas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="Faturamento líquido"
          value={formatBRL(r.faturamentoLiquido)}
          delta={`Bruto ${formatBRL(r.faturamentoBruto)}`}
          icon={DollarSign}
          variant="green"
        />
        <KPICard
          label="Cancelamentos"
          value={formatBRL(r.valorCancelado)}
          delta={`${r.qtdCanceladas} venda(s)`}
          deltaColor="var(--red)"
          icon={TrendingDown}
          variant="orange"
        />
        <KPICard
          label="Vendas líquidas"
          value={formatNumber(r.qtdVendasLiquidas)}
          delta={`${r.qtdVendasBrutas} brutas`}
          icon={ShoppingCart}
          variant="cyan"
        />
        <KPICard
          label="Ticket médio"
          value={formatBRL(r.ticketMedio)}
          icon={Target}
          variant="purple"
        />
      </div>

      <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>Captação</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        <KPICard label="Leads" value={formatNumber(r.totalLeads)} icon={Users} />
        <KPICard
          label="Taxa de conversão"
          value={formatPercent(r.taxaConversao)}
          delta="lead → venda"
          icon={Percent}
        />
        <KPICard
          label="Ciclo médio"
          value={`${r.cicloMedio.toFixed(1)} dias`}
          delta="início → venda"
          icon={Clock}
        />
      </div>

      <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>Mídia (Meta Ads)</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <KPICard
          label="Investimento Meta"
          value={formatBRL(rMeta.investimentoTotal)}
          delta={rMeta.diaIni && rMeta.diaFim ? `${rMeta.diaIni.toLocaleDateString("pt-BR")} → ${rMeta.diaFim.toLocaleDateString("pt-BR")}` : undefined}
          icon={Megaphone}
        />
        <KPICard
          label="ROAS"
          value={roas > 0 ? `${roas.toFixed(2)}x` : "—"}
          delta="líquido / invest. Meta"
          icon={Target}
          variant="green"
        />
        <KPICard
          label="Conversas iniciadas"
          value={formatNumber(rMeta.conversasIniciadas)}
          icon={Sparkles}
        />
        <KPICard
          label="Vendas atribuídas Meta"
          value={formatNumber(rMeta.vendasMeta)}
          icon={ShoppingCart}
        />
      </div>
    </div>
  );
}
