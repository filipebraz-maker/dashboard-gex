import { MesSelector } from "@/components/MesSelector";
import {
  carregarVendas,
  filtrarPorMes,
  agruparPorChave,
  MESES_VENDAS,
} from "@/lib/gex-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function VendasPage({ searchParams }: PageProps) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? "TODOS";

  const vendas = await carregarVendas();
  const vendasMes = filtrarPorMes(vendas, mes);

  const porArea = agruparPorChave(vendasMes, (v) => v.area || "(sem área)");
  const porProduto = agruparPorChave(vendasMes, (v) => v.produtoBase);
  const porOrigem = agruparPorChave(vendasMes, (v) => v.origem || "(sem origem)");
  const porTipo = agruparPorChave(vendasMes, (v) =>
    v.cancelada ? "CANCELADA" : v.tipos[0] || "(sem tipo)"
  );

  const ordenadas = [...vendasMes].sort((a, b) => b.dataVenda.getTime() - a.dataVenda.getTime());

  const faturamentoLiquido = vendasMes.filter((v) => !v.cancelada).reduce((s, v) => s + v.valor, 0);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Vendas</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {mes === "TODOS" ? "Todos os meses" : mes} · {vendasMes.filter((v) => !v.cancelada).length} líquidas · {formatBRL(faturamentoLiquido)}
          </p>
        </div>
        <MesSelector mes={mes} meses={MESES_VENDAS.map((m) => m.rotulo)} />
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <Bloco titulo="Por área" linhas={porArea} />
        <Bloco titulo="Por produto" linhas={porProduto} />
        <Bloco titulo="Por origem" linhas={porOrigem} />
        <Bloco titulo="Por tipo" linhas={porTipo} />
      </div>

      <section className="card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-4">Vendas ({vendasMes.length})</h2>
        <div className="overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                <th>Data</th>
                <th>Aluno</th>
                <th>Produto</th>
                <th>Área</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th className="num">Valor</th>
                <th className="num">Tempo</th>
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
                      <span className="pill" style={{ background: "rgba(248, 113, 113, 0.15)", color: "var(--red)" }}>
                        Cancelada
                      </span>
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
      </section>
    </div>
  );
}

interface BlocoProps {
  titulo: string;
  linhas: Array<{ chave: string; qtd: number; valor: number; qtdCanc: number; valorCanc: number }>;
}

function Bloco({ titulo, linhas }: BlocoProps) {
  const totalLiquido = linhas.reduce((s, l) => s + l.valor, 0);
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold mb-3">{titulo}</h2>
      <table className="dt">
        <thead>
          <tr>
            <th>—</th>
            <th className="num">Vendas</th>
            <th className="num">Líquido</th>
            <th className="num">%</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const pct = totalLiquido > 0 ? (l.valor / totalLiquido) * 100 : 0;
            return (
              <tr key={l.chave}>
                <td className="mono">{l.chave}</td>
                <td className="num">
                  {formatNumber(l.qtd)}
                  {l.qtdCanc > 0 && (
                    <span className="ml-1 text-[10px]" style={{ color: "var(--red)" }}>
                      -{l.qtdCanc}
                    </span>
                  )}
                </td>
                <td className="num">{formatBRL(l.valor)}</td>
                <td className="num" style={{ color: "var(--text-dim)" }}>{formatPercent(pct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
