import { DollarSign, ShoppingCart, Users, TrendingDown, Clock, Percent, Target } from "lucide-react";
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
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? "TODOS";

  const [vendas, leads] = await Promise.all([carregarVendas(), carregarLeadsDiarios()]);
  const vendasFiltradas = filtrarPorMes(vendas, mes);
  const leadsFiltrados = filtrarLeadsPorMes(leads, mes);
  const r = resumir(vendasFiltradas, leadsFiltrados);

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
        <KPICard
          label="Leads"
          value={formatNumber(r.totalLeads)}
          icon={Users}
        />
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
    </div>
  );
}
