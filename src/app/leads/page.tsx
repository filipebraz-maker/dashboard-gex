import { Users, TrendingUp, Sparkles, Target } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { LineChartWrapper } from "@/components/LineChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  carregarLeadsDiarios,
  agruparPorChave,
  leadsPorDia,
  origemLeadsAgregado,
  getPeriodoFromQuery,
  filtrarVendasPorRange,
  filtrarLeadsPorRange,
  PERIODO_OPTIONS,
} from "@/lib/gex-data";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mes?: string; de?: string; ate?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { mes, de, ate } = await searchParams;
  const periodo = getPeriodoFromQuery(mes, de, ate);

  const [vendas, leads] = await Promise.all([carregarVendas(), carregarLeadsDiarios()]);
  const vendasF = filtrarVendasPorRange(vendas, periodo).filter((v) => !v.cancelada);
  const leadsF = filtrarLeadsPorRange(leads, periodo);

  const totalLeads = leadsF.reduce((s, l) => s + l.totalLeads, 0);
  const totalVendasRelatorio = leadsF.reduce((s, l) => s + l.vendasContagem, 0);
  const taxaConv = totalLeads > 0 ? (vendasF.length / totalLeads) * 100 : 0;
  const chartDiario = leadsPorDia(leadsF);

  const origens = origemLeadsAgregado(leadsF);
  const vendasPorOrigem = new Map(
    agruparPorChave(vendasF, (v) => v.origem || "(sem origem)").map((x) => [x.chave, x])
  );

  const melhorOrigem = origens[0];
  const dias = leadsF.filter((l) => l.totalLeads > 0).length;
  const mediaPorDia = dias > 0 ? totalLeads / dias : 0;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Leads</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Captação e atribuição por canal · RELATÓRIO DIÁRIO
          </p>
        </div>
        <MesSelector options={PERIODO_OPTIONS} currentKey={periodo.key} currentLabel={periodo.label} />
      </header>

      <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" style={{ animationDelay: "0.05s" }}>
        <KPICard icon={Users} label="Total de Leads" value={formatNumber(totalLeads)} delta={`${dias} dia(s) com lead`} variant="cyan" />
        <KPICard icon={Sparkles} label="Média/dia" value={formatNumber(Math.round(mediaPorDia))} delta="leads por dia" />
        <KPICard icon={Target} label="Taxa Conv." value={formatPercent(taxaConv, 2)} delta="lead → venda" variant="purple" />
        <KPICard
          icon={TrendingUp}
          label="Melhor canal"
          value={melhorOrigem?.origem || "—"}
          delta={melhorOrigem ? `${formatNumber(melhorOrigem.leads)} leads (${formatPercent(melhorOrigem.percentual, 1)})` : undefined}
          variant="green"
        />
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.1s" }}>
        <SectionCard title="Leads × Vendas por Dia" subtitle="Evolução diária da captação">
          {chartDiario.length > 0 ? (
            <LineChartWrapper
              data={chartDiario}
              xKey="data"
              lines={[
                { key: "leads", color: "#22D3EE", name: "Leads" },
                { key: "vendas", color: "#A78BFA", name: "Vendas" },
              ]}
              format="number"
              height={300}
            />
          ) : (
            <div className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
          )}
        </SectionCard>
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.15s" }}>
        <SectionCard title="Origem dos Leads" subtitle={`${origens.length} canal(is) · taxa de conversão por canal`}>
          {origens.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados no período</div>
          ) : (
            <table className="dt">
              <thead>
                <tr>
                  <th>Canal</th>
                  <th className="text-right">Leads</th>
                  <th className="text-right">% leads</th>
                  <th className="text-right">Vendas</th>
                  <th className="text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {origens.map((o) => {
                  const v = vendasPorOrigem.get(o.origem);
                  const conv = o.leads > 0 && v ? (v.qtd / o.leads) * 100 : 0;
                  return (
                    <tr key={o.origem}>
                      <td>
                        <div className="mono">{o.origem}</div>
                        <HeatBar value={o.percentual} color="cyan" className="mt-1.5" />
                      </td>
                      <td className="num">{formatNumber(o.leads)}</td>
                      <td className="num" style={{ color: "var(--cyan)" }}>{formatPercent(o.percentual, 1)}</td>
                      <td className="num">{v ? formatNumber(v.qtd) : "—"}</td>
                      <td className="num" style={{ color: conv >= 10 ? "var(--green)" : conv >= 5 ? "var(--amber)" : "var(--text-dim)" }}>
                        {v ? formatPercent(conv, 1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.2s" }}>
        <SectionCard title="Detalhe Diário" subtitle={`${leadsF.length} dia(s) · ${formatNumber(totalVendasRelatorio)} venda(s) registrada(s)`}>
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="min-w-[500px] px-4 md:px-5">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">Vendas</th>
                    <th className="text-right">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsF
                    .slice()
                    .sort((a, b) => a.data.getTime() - b.data.getTime())
                    .map((l) => (
                      <tr key={l.data.toISOString()}>
                        <td className="mono">{l.data.toLocaleDateString("pt-BR")}</td>
                        <td className="num">{l.totalLeads > 0 ? formatNumber(l.totalLeads) : "—"}</td>
                        <td className="num" style={{ color: "var(--purple)" }}>{l.vendasContagem > 0 ? formatNumber(l.vendasContagem) : "—"}</td>
                        <td className="num" style={{ color: "var(--text-dim)" }}>{l.followUpCount > 0 ? formatNumber(l.followUpCount) : "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
