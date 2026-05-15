import { DollarSign, Eye, MousePointerClick, MessageCircle, ShoppingCart, Percent } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { carregarMetaAds, resumirMeta, agruparPorAnuncio, agruparPorCampanha } from "@/lib/meta-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

export default async function TrafegoPage() {
  const linhas = await carregarMetaAds();
  const r = resumirMeta(linhas);
  const porAnuncio = agruparPorAnuncio(linhas);
  const porCampanha = agruparPorCampanha(linhas);

  const periodo = r.diaIni && r.diaFim
    ? `${r.diaIni.toLocaleDateString("pt-BR")} → ${r.diaFim.toLocaleDateString("pt-BR")}`
    : "—";

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto pb-24">
      <header className="reveal mb-6">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Tráfego</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Meta Ads · {periodo} · {linhas.length} registro(s)
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        <KPICard label="Investimento" value={formatBRL(r.investimentoTotal)} icon={DollarSign} variant="green" />
        <KPICard label="Impressões" value={formatNumber(r.impressoes)} icon={Eye} />
        <KPICard label="Cliques" value={formatNumber(r.cliques)} icon={MousePointerClick} variant="cyan" />
        <KPICard label="CTR" value={formatPercent(r.ctr, 2)} icon={Percent} />
        <KPICard label="CPC" value={formatBRL(r.cpc)} />
        <KPICard label="CPM" value={formatBRL(r.cpm)} />
        <KPICard label="Conversas" value={formatNumber(r.conversasIniciadas)} icon={MessageCircle} variant="purple" />
        <KPICard label="Vendas Meta" value={formatNumber(r.vendasMeta)} icon={ShoppingCart} variant="orange" />
      </div>

      <section className="card p-5 md:p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">Por campanha ({porCampanha.length})</h2>
        <div className="overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                <th>Campanha</th>
                <th className="num">Invest.</th>
                <th className="num">Impr.</th>
                <th className="num">Cliques</th>
                <th className="num">Conv. iniciadas</th>
                <th className="num">Vendas Meta</th>
              </tr>
            </thead>
            <tbody>
              {porCampanha.map((c) => (
                <tr key={c.campanha}>
                  <td style={{ maxWidth: 480 }} className="truncate">{c.campanha}</td>
                  <td className="num">{formatBRL(c.investimento)}</td>
                  <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(c.impressoes)}</td>
                  <td className="num">{formatNumber(c.cliques)}</td>
                  <td className="num">{c.conversasIniciadas > 0 ? formatNumber(c.conversasIniciadas) : "—"}</td>
                  <td className="num">{c.vendasMeta > 0 ? formatNumber(c.vendasMeta) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-4">Por criativo ({porAnuncio.length})</h2>
        <div className="overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                <th>Anúncio</th>
                <th>Campanha</th>
                <th className="num">Invest.</th>
                <th className="num">Impr.</th>
                <th className="num">Cliques</th>
                <th className="num">Conv.</th>
                <th className="num">Vendas</th>
              </tr>
            </thead>
            <tbody>
              {porAnuncio.map((a) => (
                <tr key={a.anuncio}>
                  <td>{a.anuncio}</td>
                  <td style={{ maxWidth: 320, color: "var(--text-dim)" }} className="truncate">{a.campanha}</td>
                  <td className="num">{formatBRL(a.investimento)}</td>
                  <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(a.impressoes)}</td>
                  <td className="num">{formatNumber(a.cliques)}</td>
                  <td className="num">{a.conversasIniciadas > 0 ? formatNumber(a.conversasIniciadas) : "—"}</td>
                  <td className="num">{a.vendasMeta > 0 ? formatNumber(a.vendasMeta) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
