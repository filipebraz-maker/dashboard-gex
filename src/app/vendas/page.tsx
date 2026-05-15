import { DollarSign, ShoppingCart, Target, TrendingDown } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { BarChartWrapper } from "@/components/BarChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { MesSelector } from "@/components/MesSelector";
import { VendasTable, type VendaRow } from "@/components/VendasTable";
import {
  carregarVendas,
  filtrarPorMes,
  agruparPorChave,
  faturamentoPorMes,
  slugParaMes,
  MESES_VENDAS,
} from "@/lib/gex-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

function normalizarAluno(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export default async function VendasPage({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = slugParaMes(mesParam);

  const vendas = await carregarVendas();

  // Conta compras por aluno em todo o histórico (não só no mês filtrado)
  const comprasPorAluno = new Map<string, number>();
  for (const v of vendas) {
    if (v.cancelada) continue;
    const k = normalizarAluno(v.aluno);
    comprasPorAluno.set(k, (comprasPorAluno.get(k) || 0) + 1);
  }

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

  const linhas: VendaRow[] = vendasMes.map((v) => {
    const qtd = comprasPorAluno.get(normalizarAluno(v.aluno)) || 0;
    return {
      dataVendaISO: v.dataVenda.toISOString().slice(0, 10),
      dataVendaBR: v.dataVenda.toLocaleDateString("pt-BR"),
      aluno: v.aluno,
      produtoBase: v.produtoBase,
      area: v.area || "",
      tipos: v.tipos,
      origem: v.origem,
      valor: v.valor,
      tempo: v.tempo,
      cancelada: v.cancelada,
      recorrente: qtd > 1,
      qtdComprasAluno: qtd,
    };
  });

  const alunosRecorrentes = new Set(
    Array.from(comprasPorAluno.entries())
      .filter(([, n]) => n > 1)
      .map(([k]) => k)
  );
  const recorrentesNoMes = linhas.filter((l) => l.recorrente && !l.cancelada).length;

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
        <KPICard icon={ShoppingCart} label="Vendas Líquidas" value={formatNumber(ativas.length)} delta={`${vendasMes.length} brutas · ${recorrentesNoMes} recorrentes`} variant="cyan" />
        <KPICard icon={Target} label="Ticket Médio" value={formatBRL(ticket)} delta={`${alunosRecorrentes.size} alunos com 2+ compras`} variant="green" />
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
        <SectionCard
          title="Todas as Vendas"
          subtitle={`${linhas.length} venda(s) · clique nas colunas pra ordenar · busque por nome`}
        >
          <VendasTable vendas={linhas} />
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
