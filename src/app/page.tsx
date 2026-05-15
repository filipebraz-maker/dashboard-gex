import { DollarSign, Target, Users, ShoppingCart, TrendingUp, Megaphone } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { FunnelRow } from "@/components/FunnelRow";
import { LineChartWrapper } from "@/components/LineChartWrapper";
import { BarChartWrapper } from "@/components/BarChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { Pill } from "@/components/Pill";
import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  carregarLeadsDiarios,
  resumir,
  vendasPorDia,
  leadsPorDia,
  faturamentoPorMes,
  origemLeadsAgregado,
  getPeriodoFromQuery,
  filtrarVendasPorRange,
  filtrarLeadsPorRange,
  PERIODO_OPTIONS,
} from "@/lib/gex-data";
import { carregarMetaAds, resumirMeta, agruparPorAnuncio, filtrarMetaPorRange } from "@/lib/meta-data";
import type { AnuncioDia } from "@/lib/meta-types";
import { formatBRL, formatBRLDetalhado, formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mes?: string; de?: string; ate?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { mes, de, ate } = await searchParams;
  const periodo = getPeriodoFromQuery(mes, de, ate);

  let meta: AnuncioDia[] = [];
  const [vendas, leads] = await Promise.all([carregarVendas(), carregarLeadsDiarios()]);
  try {
    meta = await carregarMetaAds();
  } catch {
    meta = [];
  }

  const vendasF = filtrarVendasPorRange(vendas, periodo);
  const leadsF = filtrarLeadsPorRange(leads, periodo);
  const metaF = filtrarMetaPorRange(meta, periodo);

  const r = resumir(vendasF, leadsF);
  const rMeta = resumirMeta(metaF);

  const roas = rMeta.investimentoTotal > 0 ? r.faturamentoLiquido / rMeta.investimentoTotal : 0;
  const cpl = r.totalLeads > 0 && rMeta.investimentoTotal > 0 ? rMeta.investimentoTotal / r.totalLeads : 0;

  const chartVendas = vendasPorDia(vendasF);
  const chartLeads = leadsPorDia(leadsF);
  const chartMeses = faturamentoPorMes(vendas);
  const origens = origemLeadsAgregado(leadsF);
  const topCriativos = agruparPorAnuncio(metaF).slice(0, 8);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Visão Geral</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {periodo.label} · {r.qtdVendasLiquidas} vendas · {formatNumber(r.totalLeads)} leads
          </p>
        </div>
        <MesSelector options={PERIODO_OPTIONS} currentKey={periodo.key} currentLabel={periodo.label} />
      </header>

      <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" style={{ animationDelay: "0.05s" }}>
        <KPICard
          icon={DollarSign}
          label="Faturamento Líquido"
          value={formatBRL(r.faturamentoLiquido)}
          delta={`Bruto ${formatBRL(r.faturamentoBruto)}`}
          variant="purple"
        />
        <KPICard
          icon={Megaphone}
          label="Investimento Meta"
          value={formatBRL(rMeta.investimentoTotal)}
          delta={roas > 0 ? `ROAS ${roas.toFixed(2)}x` : "—"}
          deltaColor="var(--cyan)"
          variant="cyan"
        />
        <KPICard
          icon={Users}
          label="Total de Leads"
          value={formatNumber(r.totalLeads)}
          delta={cpl > 0 ? `CPL ${formatBRLDetalhado(cpl)}` : `Conv. ${formatPercent(r.taxaConversao, 1)}`}
        />
        <KPICard
          icon={ShoppingCart}
          label="Vendas Líquidas"
          value={formatNumber(r.qtdVendasLiquidas)}
          delta={`Ticket ${formatBRL(r.ticketMedio)}`}
        />
      </div>

      <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-3 mb-5" style={{ animationDelay: "0.1s" }}>
        <div className="lg:col-span-5">
          <SectionCard title="Funil de Conversão" subtitle="Da impressão ao faturamento">
            <div className="space-y-2.5">
              <FunnelRow label="Impressões" value={formatNumber(rMeta.impressoes)} pairLabel="CPM" pairValue={formatBRLDetalhado(rMeta.cpm)} />
              <FunnelRow label="Cliques" value={formatNumber(rMeta.cliques)} pairLabel="CTR" pairValue={formatPercent(rMeta.ctr, 2)} />
              <FunnelRow label="Conversas" value={formatNumber(rMeta.conversasIniciadas)} pairLabel="CPC" pairValue={formatBRLDetalhado(rMeta.cpc)} />
              <FunnelRow label="Leads" value={formatNumber(r.totalLeads)} pairLabel="Conv. Lead" pairValue={formatPercent(r.taxaConversao, 1)} />
              <FunnelRow label="Faturamento" value={formatBRL(r.faturamentoLiquido)} pairLabel="Ticket" pairValue={formatBRL(r.ticketMedio)} highlight />
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-7">
          <SectionCard title="Performance do Período" subtitle={periodo.label}>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Vendas brutas</div>
                  <div className="text-lg font-semibold mono">{formatNumber(r.qtdVendasBrutas)}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--red)" }}>
                    {r.qtdCanceladas} cancelada(s)
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Cancelamentos</div>
                  <div className="text-lg font-semibold mono">{formatBRL(r.valorCancelado)}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
                    {formatPercent(r.faturamentoBruto > 0 ? (r.valorCancelado / r.faturamentoBruto) * 100 : 0, 1)} do bruto
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Ciclo médio</div>
                  <div className="text-lg font-semibold mono">{r.cicloMedio.toFixed(1)}d</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
                    início → venda
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Vendas atribuídas Meta</div>
                  <div className="text-base font-semibold mono">{formatNumber(rMeta.vendasMeta)}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
                    {formatNumber(rMeta.conversasIniciadas)} conversas iniciadas
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>ROAS</div>
                    {roas > 0 && <Pill tone={roas >= 5 ? "green" : roas >= 3 ? "amber" : "orange"}>{roas.toFixed(2)}x</Pill>}
                  </div>
                  <div className="text-base font-semibold mono">{formatBRL(r.faturamentoLiquido)} ÷ {formatBRL(rMeta.investimentoTotal)}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
                    fat. líquido / invest. Meta
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5" style={{ animationDelay: "0.15s" }}>
        <SectionCard title="Captação Diária" subtitle={`${chartLeads.length} dias`}>
          {chartLeads.length > 0 ? (
            <LineChartWrapper
              data={chartLeads}
              xKey="data"
              lines={[
                { key: "leads", color: "#22D3EE", name: "Leads" },
                { key: "vendas", color: "#A78BFA", name: "Vendas (rel.)" },
              ]}
              format="number"
              height={260}
            />
          ) : (
            <div className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
          )}
        </SectionCard>
        <SectionCard title="Faturamento Diário" subtitle={`${chartVendas.length} dias com venda`}>
          {chartVendas.length > 0 ? (
            <BarChartWrapper
              data={chartVendas}
              xKey="data"
              bars={[{ key: "faturamento", color: "#A78BFA", name: "Faturamento" }]}
              format="currency"
              height={260}
            />
          ) : (
            <div className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
          )}
        </SectionCard>
      </div>

      <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-3 mb-5" style={{ animationDelay: "0.2s" }}>
        <div className="lg:col-span-7">
          <SectionCard title="Top Criativos" subtitle="Por investimento — Meta Ads">
            {topCriativos.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:-mx-5">
                <div className="min-w-[600px] px-4 md:px-5">
                  <table className="dt">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Criativo</th>
                        <th className="text-right">Invest.</th>
                        <th className="text-right">Cliques</th>
                        <th className="text-right">Conversas</th>
                        <th className="text-right">Vendas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCriativos.map((c, i) => (
                        <tr key={c.anuncio}>
                          <td><span className="mono" style={{ color: "var(--text-muted)" }}>{String(i + 1).padStart(2, "0")}</span></td>
                          <td className="max-w-[220px] truncate" title={c.anuncio}>{c.anuncio}</td>
                          <td className="num">{formatBRL(c.investimento)}</td>
                          <td className="num">{formatNumber(c.cliques)}</td>
                          <td className="num" style={{ color: "var(--cyan)" }}>{c.conversasIniciadas > 0 ? formatNumber(c.conversasIniciadas) : "—"}</td>
                          <td className="num">{c.vendasMeta > 0 ? formatNumber(c.vendasMeta) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-5">
          <SectionCard title="Origem dos Leads" subtitle="RELATÓRIO DIÁRIO">
            {origens.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
            ) : (
              <table className="dt">
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {origens.slice(0, 8).map((o) => (
                    <tr key={o.origem}>
                      <td>
                        <div className="mono">{o.origem}</div>
                        <HeatBar value={o.percentual} color="cyan" className="mt-1.5" />
                      </td>
                      <td className="num">{formatNumber(o.leads)}</td>
                      <td className="num" style={{ color: "var(--cyan)" }}>{formatPercent(o.percentual, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.25s" }}>
        <SectionCard title="Faturamento por Mês" subtitle="Evolução do faturamento líquido">
          <BarChartWrapper
            data={chartMeses}
            xKey="mes"
            bars={[{ key: "faturamento", color: "#A78BFA", name: "Faturamento" }]}
            format="currency"
            height={260}
          />
        </SectionCard>
      </div>

      <div className="reveal flex items-center justify-between text-xs pt-4 mt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <span>Gex Dashboard · {periodo.label}</span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          Atualizado a cada 60s
        </span>
      </div>
    </div>
  );
}
