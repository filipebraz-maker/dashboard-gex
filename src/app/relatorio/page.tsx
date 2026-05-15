import { CalendarDays, Users, ShoppingCart, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { carregarLeadsDiarios, quinzenarRelatorio } from "@/lib/gex-data";
import type { LeadDiario } from "@/lib/gex-types";
import type { ResumoQuinzena } from "@/lib/gex-data";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RelatorioPage() {
  const leads = await carregarLeadsDiarios();
  const mesesAsc = quinzenarRelatorio(leads);
  // Mais recente primeiro: dentro de cada mês, 2ª quinzena antes da 1ª;
  // dentro de cada quinzena, dias em ordem decrescente.
  const meses = [...mesesAsc].reverse().map((m) => ({
    ...m,
    quinzenas: [
      { ...m.quinzenas[1], dias: [...m.quinzenas[1].dias].reverse() },
      { ...m.quinzenas[0], dias: [...m.quinzenas[0].dias].reverse() },
    ] as typeof m.quinzenas,
  }));

  const totalLeadsGeral = meses.reduce((s, m) => s + m.totalMes.leads, 0);
  const totalVendasGeral = meses.reduce((s, m) => s + m.totalMes.vendas, 0);
  const totalFollowUpGeral = meses.reduce((s, m) => s + m.totalMes.followUp, 0);
  const conversaoGeral = totalLeadsGeral > 0 ? (totalVendasGeral / totalLeadsGeral) * 100 : 0;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal mb-5">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Relatório Diário</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Captação por origem · separado por quinzena
        </p>
      </header>

      <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" style={{ animationDelay: "0.05s" }}>
        <KPICard icon={Users} label="Leads Totais" value={formatNumber(totalLeadsGeral)} delta={`${meses.length} mês(es)`} variant="cyan" />
        <KPICard icon={ShoppingCart} label="Vendas (relatório)" value={formatNumber(totalVendasGeral)} variant="purple" />
        <KPICard icon={TrendingUp} label="Conversão" value={formatPercent(conversaoGeral, 2)} delta="lead → venda" variant="green" />
        <KPICard icon={CalendarDays} label="Follow-up" value={formatNumber(totalFollowUpGeral)} delta="ações no período" />
      </div>

      <div className="space-y-5">
        {meses.map((m) => (
          <MesBlock key={m.mesNum} mes={m} />
        ))}
      </div>
    </div>
  );
}

interface MesBlockProps {
  mes: ReturnType<typeof quinzenarRelatorio>[number];
}

function MesBlock({ mes }: MesBlockProps) {
  return (
    <div className="reveal">
      <SectionCard
        title={mes.rotulo}
        subtitle={`${formatNumber(mes.totalMes.leads)} leads · ${formatNumber(mes.totalMes.vendas)} vendas · ${formatPercent(mes.totalMes.leads > 0 ? (mes.totalMes.vendas / mes.totalMes.leads) * 100 : 0, 2)} conv.`}
      >
        <div className="space-y-4">
          {mes.quinzenas.map((q, idx) => (
            <QuinzenaBlock key={idx} origens={mes.origens} quinzena={q} />
          ))}

          <div
            className="rounded-lg px-4 py-3 flex flex-wrap items-baseline justify-between gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.10), rgba(167, 139, 250, 0.03))",
              border: "1px solid rgba(167, 139, 250, 0.30)",
            }}
          >
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--purple)" }}>
              Total do mês
            </div>
            <div className="flex flex-wrap gap-4 text-sm mono">
              <span>{formatNumber(mes.totalMes.leads)} leads</span>
              <span>{formatNumber(mes.totalMes.vendas)} vendas</span>
              {mes.totalMes.followUp > 0 && (
                <span style={{ color: "var(--text-dim)" }}>{formatNumber(mes.totalMes.followUp)} follow-up</span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

interface QuinzenaBlockProps {
  origens: string[];
  quinzena: ResumoQuinzena;
}

function QuinzenaBlock({ origens, quinzena }: QuinzenaBlockProps) {
  if (quinzena.dias.length === 0) return null;
  const colunasOrigem = origens.filter((o) => quinzena.totalPorOrigem[o] || quinzena.dias.some((d) => d.porOrigem[o]));
  const temFollowUp = quinzena.totalFollowUp > 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          {quinzena.rotulo} <span style={{ color: "var(--text-dim)" }}>· dias {String(quinzena.diaInicio).padStart(2, "0")}–{String(quinzena.diaFim).padStart(2, "0")}</span>
        </div>
        <div className="text-[11px] mono" style={{ color: "var(--text-dim)" }}>
          {formatNumber(quinzena.totalLeads)} leads · {formatNumber(quinzena.totalVendas)} vendas
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 md:-mx-5">
        <div className="min-w-[600px] px-4 md:px-5">
          <table className="dt">
            <thead>
              <tr>
                <th>Data</th>
                {colunasOrigem.map((o) => (
                  <th key={o} className="text-right mono text-[10px]">{o}</th>
                ))}
                {temFollowUp && <th className="text-right">Follow-up</th>}
                <th className="text-right">Leads</th>
                <th className="text-right">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {quinzena.dias.map((d) => (
                <LinhaDia key={d.data.toISOString()} dia={d} colunasOrigem={colunasOrigem} temFollowUp={temFollowUp} />
              ))}
              <tr style={{ fontWeight: 600, background: "var(--bg-elev)" }}>
                <td className="mono text-[11px]" style={{ color: "var(--text-dim)" }}>Total</td>
                {colunasOrigem.map((o) => (
                  <td key={o} className="num">{quinzena.totalPorOrigem[o] ? formatNumber(quinzena.totalPorOrigem[o]) : "—"}</td>
                ))}
                {temFollowUp && (
                  <td className="num" style={{ color: "var(--text-dim)" }}>{quinzena.totalFollowUp > 0 ? formatNumber(quinzena.totalFollowUp) : "—"}</td>
                )}
                <td className="num" style={{ color: "var(--cyan)" }}>{formatNumber(quinzena.totalLeads)}</td>
                <td className="num" style={{ color: "var(--purple)" }}>{formatNumber(quinzena.totalVendas)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface LinhaDiaProps {
  dia: LeadDiario;
  colunasOrigem: string[];
  temFollowUp: boolean;
}

function LinhaDia({ dia, colunasOrigem, temFollowUp }: LinhaDiaProps) {
  return (
    <tr>
      <td className="mono text-xs">{dia.data.toLocaleDateString("pt-BR")}</td>
      {colunasOrigem.map((o) => {
        const n = dia.porOrigem[o] || 0;
        return (
          <td key={o} className="num" style={{ color: n > 0 ? "var(--text)" : "var(--text-muted)" }}>
            {n > 0 ? formatNumber(n) : "—"}
          </td>
        );
      })}
      {temFollowUp && (
        <td className="num" style={{ color: "var(--text-dim)" }}>{dia.followUpCount > 0 ? formatNumber(dia.followUpCount) : "—"}</td>
      )}
      <td className="num" style={{ color: dia.totalLeads > 0 ? "var(--cyan)" : "var(--text-muted)" }}>
        {dia.totalLeads > 0 ? formatNumber(dia.totalLeads) : "—"}
      </td>
      <td className="num" style={{ color: dia.vendasContagem > 0 ? "var(--purple)" : "var(--text-muted)" }}>
        {dia.vendasContagem > 0 ? formatNumber(dia.vendasContagem) : "—"}
      </td>
    </tr>
  );
}
