import { DollarSign, Eye, MousePointerClick, MessageCircle } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { FunnelRow } from "@/components/FunnelRow";
import { LineChartWrapper } from "@/components/LineChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import {
  resumirMeta,
  agruparPorAnuncio,
  agruparPorCampanha,
  metaPorDia,
} from "@/lib/meta-data";
import type { AnuncioDia } from "@/lib/meta-types";
import { formatBRL, formatBRLDetalhado, formatNumber, formatPercent } from "@/lib/utils";

interface Props {
  linhas: AnuncioDia[];
  vazioMsg?: string;
  /** Conteúdo extra a renderizar no topo (ex: cards de crescimento de perfil na aba Atração) */
  extraTopo?: React.ReactNode;
}

export function TrafegoCategoriaView({ linhas, vazioMsg = "Sem dados nesta categoria", extraTopo }: Props) {
  const r = resumirMeta(linhas);
  const porAnuncio = agruparPorAnuncio(linhas);
  const porCampanha = agruparPorCampanha(linhas);
  const porDia = metaPorDia(linhas);
  const maxInvestCampanha = Math.max(...porCampanha.map((c) => c.investimento), 1);

  if (linhas.length === 0) {
    return (
      <SectionCard title="Sem dados">
        <p className="text-xs py-8 text-center" style={{ color: "var(--text-dim)" }}>
          {vazioMsg}
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      {extraTopo}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard icon={DollarSign} label="Valor Gasto" value={formatBRL(r.investimentoTotal)} delta={`CPM ${formatBRLDetalhado(r.cpm)}`} variant="purple" />
        <KPICard icon={Eye} label="Impressões" value={formatNumber(r.impressoes)} delta={`CTR ${formatPercent(r.ctr, 2)}`} variant="cyan" />
        <KPICard icon={MousePointerClick} label="Cliques" value={formatNumber(r.cliques)} delta={`CPC ${formatBRLDetalhado(r.cpc)}`} />
        <KPICard
          icon={MessageCircle}
          label="Conversas"
          value={formatNumber(r.conversasIniciadas)}
          delta={`${formatNumber(r.vendasMeta)} venda(s) Meta`}
          deltaColor="var(--green)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-5">
        <div className="lg:col-span-5">
          <SectionCard title="Funil" subtitle="Da impressão à venda atribuída">
            <div className="space-y-2.5">
              <FunnelRow label="Impressões" value={formatNumber(r.impressoes)} pairLabel="CPM" pairValue={formatBRLDetalhado(r.cpm)} />
              <FunnelRow label="Cliques" value={formatNumber(r.cliques)} pairLabel="CTR" pairValue={formatPercent(r.ctr, 2)} />
              <FunnelRow label="Conversas" value={formatNumber(r.conversasIniciadas)} pairLabel="CPC" pairValue={formatBRLDetalhado(r.cpc)} />
              <FunnelRow label="Vendas Meta" value={formatNumber(r.vendasMeta)} pairLabel="Alcance" pairValue={formatNumber(r.alcance)} highlight />
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-7">
          <SectionCard title="Investimento × Conversas" subtitle="Evolução diária">
            {porDia.length > 0 ? (
              <LineChartWrapper
                data={porDia}
                xKey="data"
                lines={[
                  { key: "investimento", color: "#A78BFA", name: "Investimento" },
                  { key: "conversas", color: "#22D3EE", name: "Conversas" },
                ]}
                format="number"
                height={300}
              />
            ) : (
              <div className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados</div>
            )}
          </SectionCard>
        </div>
      </div>

      <div className="mb-5">
        <SectionCard title="Por Campanha" subtitle={`${porCampanha.length} campanha(s)`}>
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="min-w-[700px] px-4 md:px-5">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th className="text-right">Invest.</th>
                    <th className="text-right">Impr.</th>
                    <th className="text-right">Cliques</th>
                    <th className="text-right">Conversas</th>
                    <th className="text-right">Vendas</th>
                  </tr>
                </thead>
                <tbody>
                  {porCampanha.map((c) => (
                    <tr key={c.campanha}>
                      <td>
                        <div className="max-w-[360px] truncate" title={c.campanha}>{c.campanha}</div>
                        <HeatBar value={(c.investimento / maxInvestCampanha) * 100} color="purple" className="mt-1.5" />
                      </td>
                      <td className="num">{formatBRL(c.investimento)}</td>
                      <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(c.impressoes)}</td>
                      <td className="num">{formatNumber(c.cliques)}</td>
                      <td className="num" style={{ color: "var(--cyan)" }}>{c.conversasIniciadas > 0 ? formatNumber(c.conversasIniciadas) : "—"}</td>
                      <td className="num">{c.vendasMeta > 0 ? formatNumber(c.vendasMeta) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Por Criativo" subtitle={`${porAnuncio.length} anúncio(s)`}>
        <div className="overflow-x-auto -mx-4 md:-mx-5">
          <div className="min-w-[700px] px-4 md:px-5">
            <table className="dt">
              <thead>
                <tr>
                  <th>Anúncio</th>
                  <th>Campanha</th>
                  <th className="text-right">Invest.</th>
                  <th className="text-right">Impr.</th>
                  <th className="text-right">Cliques</th>
                  <th className="text-right">Conv.</th>
                  <th className="text-right">Vendas</th>
                </tr>
              </thead>
              <tbody>
                {porAnuncio.map((a) => (
                  <tr key={a.anuncio}>
                    <td>{a.anuncio}</td>
                    <td className="max-w-[280px] truncate" style={{ color: "var(--text-dim)" }} title={a.campanha}>{a.campanha}</td>
                    <td className="num">{formatBRL(a.investimento)}</td>
                    <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(a.impressoes)}</td>
                    <td className="num">{formatNumber(a.cliques)}</td>
                    <td className="num" style={{ color: "var(--cyan)" }}>{a.conversasIniciadas > 0 ? formatNumber(a.conversasIniciadas) : "—"}</td>
                    <td className="num">{a.vendasMeta > 0 ? formatNumber(a.vendasMeta) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
