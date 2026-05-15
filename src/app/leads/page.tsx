import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  carregarLeadsDiarios,
  filtrarPorMes,
  filtrarLeadsPorMes,
  agruparPorChave,
  MESES_VENDAS,
} from "@/lib/gex-data";
import { formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? "TODOS";

  const [vendas, leads] = await Promise.all([carregarVendas(), carregarLeadsDiarios()]);
  const vendasF = filtrarPorMes(vendas, mes).filter((v) => !v.cancelada);
  const leadsF = filtrarLeadsPorMes(leads, mes);

  const totalLeads = leadsF.reduce((s, l) => s + l.totalLeads, 0);
  const porOrigem: Record<string, number> = {};
  for (const l of leadsF) for (const [o, n] of Object.entries(l.porOrigem)) porOrigem[o] = (porOrigem[o] || 0) + n;
  const linhasLeads = Object.entries(porOrigem).sort((a, b) => b[1] - a[1]);

  const vendasPorOrigem = new Map(
    agruparPorChave(vendasF, (v) => v.origem || "(sem origem)").map((x) => [x.chave, x])
  );

  const linhasDiarias = leadsF.slice().sort((a, b) => a.data.getTime() - b.data.getTime());

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Leads</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {mes === "TODOS" ? "Todos os meses" : mes} · {formatNumber(totalLeads)} lead(s)
          </p>
        </div>
        <MesSelector mes={mes} meses={MESES_VENDAS.map((m) => m.rotulo)} />
      </header>

      <section className="card p-5 md:p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">Leads e vendas por origem</h2>
        <table className="dt">
          <thead>
            <tr>
              <th>Origem</th>
              <th className="num">Leads</th>
              <th className="num">% leads</th>
              <th className="num">Vendas</th>
              <th className="num">Conv. lead→venda</th>
            </tr>
          </thead>
          <tbody>
            {linhasLeads.map(([origem, n]) => {
              const pct = totalLeads > 0 ? (n / totalLeads) * 100 : 0;
              const vendas = vendasPorOrigem.get(origem);
              const conv = n > 0 && vendas ? (vendas.qtd / n) * 100 : 0;
              return (
                <tr key={origem}>
                  <td className="mono">{origem}</td>
                  <td className="num">{formatNumber(n)}</td>
                  <td className="num" style={{ color: "var(--text-dim)" }}>{formatPercent(pct)}</td>
                  <td className="num">{vendas ? formatNumber(vendas.qtd) : "—"}</td>
                  <td className="num" style={{ color: conv >= 10 ? "var(--green)" : conv >= 5 ? "var(--amber)" : "var(--text-dim)" }}>
                    {vendas ? formatPercent(conv) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-4">Diário</h2>
        <div className="overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                <th>Data</th>
                <th className="num">Leads</th>
                <th className="num">Vendas (rel.)</th>
                <th className="num">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {linhasDiarias.map((l) => (
                <tr key={l.data.toISOString()}>
                  <td className="mono">{l.data.toLocaleDateString("pt-BR")}</td>
                  <td className="num">{l.totalLeads > 0 ? formatNumber(l.totalLeads) : "—"}</td>
                  <td className="num">{l.vendasContagem > 0 ? formatNumber(l.vendasContagem) : "—"}</td>
                  <td className="num" style={{ color: "var(--text-dim)" }}>{l.followUpCount > 0 ? formatNumber(l.followUpCount) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
