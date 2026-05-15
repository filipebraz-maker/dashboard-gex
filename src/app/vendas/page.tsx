import { DollarSign, ShoppingCart, Target, TrendingDown } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { BarChartWrapper } from "@/components/BarChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { Pill } from "@/components/Pill";
import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  filtrarPorMes,
  agruparPorChave,
  faturamentoPorMes,
  MESES_VENDAS,
} from "@/lib/gex-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function VendasPage({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? "TODOS";

  const vendas = await carregarVendas();
  const vendasMes = filtrarPorMes(vendas, mes);
  const ativas = vendasMes.filter((v) => !v.cancelada);
  const canceladas = vendasMes.filter((v) => v.cancelada);
  const faturamentoLiquido = ativas.reduce((s, v) => s + v.valor, 0);
  const faturamentoBruto = vendasMes.reduce((s, v) => s + v.valor, 0);
  const valorCancelado = canceladas.reduce((s, v) => s + v.valor, 0);
  const ticket = ativas.length > 0 ? faturamentoLiquido / ativas.length : 0;

  const porArea = agruparPorChave(vendasMes, (v) => v.area || "(sem área)");
  const porProduto = agruparPorChave(vendasMes, (v) => v.produtoBase);
  const porOrigem = agruparPorChave(vendasMes, (v) => v.origem || "(sem origem)");
  const porTipo = agruparPorChave(vendasMes, (v) => v.cancelada ? "CANCELADA" : v.tipos[0] || "(sem tipo)");
  const chartMeses = faturamentoPorMes(vendas);

  const ordenadas = [...vendasMes].sort((a, b) => b.dataVenda.getTime() - a.dataVenda.getTime());

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Vendas</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {mes === "TODOS" ? "Todos os meses · 2026" : mes} · {ativas.length} venda(s) líquida(s)
          </p>
        </div>
        <MesSelector mes={mes} meses={MESES_VENDAS.map((m) => m.rotulo)} />
      </header>

      <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" style={{ animationDelay: "0.05s" }}>
        <KPICard icon={DollarSign} label="Faturamento Líquido" value={formatBRL(faturamentoLiquido)} delta={`Bruto ${formatBRL(faturamentoBruto)}`} variant="purple" />
        <KPICard icon={ShoppingCart} label="Vendas Líquidas" value={formatNumber(ativas.length)} delta={`${vendasMes.length} brutas`} variant="cyan" />
        <KPICard icon={Target} label="Ticket Médio" value={formatBRL(ticket)} variant="green" />
        <KPICard icon={TrendingDown} label="Cancelamentos" value={formatBRL(valorCancelado)} delta={`${canceladas.length} venda(s)`} deltaColor="var(--red)" variant="orange" />
      </div>

      {mes === "TODOS" && (
        <div className="reveal mb-5" style={{ animationDelay: "0.1s" }}>
          <SectionCard title="Faturamento por Mês" subtitle="Evolução do faturamento líquido (2026)">
            <BarChartWrapper
              data={chartMeses}
              xKey="mes"
              bars={[{ key: "faturamento", color: "#A78BFA", name: "Faturamento" }]}
              format="currency"
              height={260}
            />
          </SectionCard>
        </div>
      )}

      <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5" style={{ animationDelay: "0.15s" }}>
        <BlocoAgregacao titulo="Por Área" linhas={porArea} cor="cyan" />
        <BlocoAgregacao titulo="Por Produto" linhas={porProduto} cor="purple" />
        <BlocoAgregacao titulo="Por Origem" linhas={porOrigem} cor="green" />
        <BlocoAgregacao titulo="Por Tipo" linhas={porTipo} cor="orange" />
      </div>

      <div className="reveal" style={{ animationDelay: "0.2s" }}>
        <SectionCard title="Todas as Vendas" subtitle={`${vendasMes.length} venda(s) · ordenado por data`}>
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="min-w-[900px] px-4 md:px-5">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Aluno</th>
                    <th>Produto</th>
                    <th>Área</th>
                    <th>Tipo</th>
                    <th>Origem</th>
                    <th className="text-right">Valor</th>
                    <th className="text-right">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenadas.map((v, i) => (
                    <tr key={`${v.aluno}-${v.dataVenda.toISOString()}-${i}`}>
                      <td className="mono">{v.dataVenda.toLocaleDateString("pt-BR")}</td>
                      <td>{v.aluno}</td>
                      <td className="mono" style={{ color: "var(--text-dim)" }}>{v.produtoBase}</td>
                      <td className="mono" style={{ color: "var(--text-dim)" }}>{v.area || "—"}</td>
                      <td>
                        {v.cancelada ? (
                          <Pill tone="red">Cancelada</Pill>
                        ) : (
                          <span className="mono" style={{ color: "var(--text-dim)" }}>{v.tipos[0] || "—"}</span>
                        )}
                      </td>
                      <td className="mono" style={{ color: "var(--text-dim)" }}>{v.origem || "—"}</td>
                      <td className="num" style={{ color: v.cancelada ? "var(--text-muted)" : "var(--text)" }}>
                        {formatBRL(v.valor)}
                      </td>
                      <td className="num" style={{ color: "var(--text-dim)" }}>
                        {v.tempo !== null ? `${v.tempo}d` : "—"}
                      </td>
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

interface BlocoProps {
  titulo: string;
  linhas: Array<{ chave: string; qtd: number; valor: number; qtdCanc: number; valorCanc: number }>;
  cor: "cyan" | "purple" | "green" | "orange";
}

function BlocoAgregacao({ titulo, linhas, cor }: BlocoProps) {
  const totalLiquido = linhas.reduce((s, l) => s + l.valor, 0);
  return (
    <SectionCard title={titulo} subtitle={`${linhas.length} item(s)`}>
      <table className="dt">
        <thead>
          <tr>
            <th>—</th>
            <th className="text-right">Vendas</th>
            <th className="text-right">Líquido</th>
            <th className="text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const pct = totalLiquido > 0 ? (l.valor / totalLiquido) * 100 : 0;
            return (
              <tr key={l.chave}>
                <td>
                  <div className="mono">{l.chave}</div>
                  <HeatBar value={pct} color={cor} className="mt-1.5" />
                </td>
                <td className="num">
                  {formatNumber(l.qtd)}
                  {l.qtdCanc > 0 && (
                    <span className="ml-1 text-[10px]" style={{ color: "var(--red)" }}>
                      -{l.qtdCanc}
                    </span>
                  )}
                </td>
                <td className="num">{formatBRL(l.valor)}</td>
                <td className="num" style={{ color: `var(--${cor})` }}>{formatPercent(pct, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionCard>
  );
}
