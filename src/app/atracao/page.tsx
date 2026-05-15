import { Sparkles, DollarSign, TrendingUp, Users } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import {
  carregarPostsAtracao,
  carregarCrescimentoGex,
  carregarCrescimentoWagner,
} from "@/lib/atracao-data";
import { formatBRL, formatNumber } from "@/lib/utils";

export const revalidate = 60;

export default async function AtracaoPage() {
  const [posts, gex, wagner] = await Promise.all([
    carregarPostsAtracao(),
    carregarCrescimentoGex(),
    carregarCrescimentoWagner(),
  ]);

  const postsValidos = posts.filter((p) => p.valorGasto > 0);
  const investimentoTotal = postsValidos.reduce((s, p) => s + p.valorGasto, 0);
  const novosSeguidoresPosts = postsValidos.reduce(
    (s, p) => s + Math.max(0, p.seguidoresApos - p.seguidoresAntes),
    0
  );
  const cpsMedio = novosSeguidoresPosts > 0 ? investimentoTotal / novosSeguidoresPosts : 0;
  const crescimentoGex = gex.reduce((s, d) => s + d.diferenca, 0);
  const crescimentoWagner = wagner.reduce((s, d) => s + d.diferenca, 0);
  const visitasTotal = postsValidos.reduce((s, p) => s + p.visitaPerfil, 0);

  const postsOrdenados = [...postsValidos].sort(
    (a, b) => (a.custoPorSeguidor || Infinity) - (b.custoPorSeguidor || Infinity)
  );

  const diasGex = [...gex].sort((a, b) => a.data.getTime() - b.data.getTime());
  const diasWagner = [...wagner].sort((a, b) => a.data.getTime() - b.data.getTime());

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1400px] mx-auto pb-24">
      <header className="reveal mb-6">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Atração</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Posts impulsionados + crescimento dos perfis Gex e Wagner
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <KPICard label="Investimento" value={formatBRL(investimentoTotal)} icon={DollarSign} variant="green" />
        <KPICard label="Visitas ao perfil" value={formatNumber(visitasTotal)} icon={Sparkles} variant="cyan" />
        <KPICard label="Seguidores via posts" value={formatNumber(novosSeguidoresPosts)} icon={Users} variant="purple" />
        <KPICard label="CPS médio" value={formatBRL(cpsMedio)} />
        <KPICard label="Saldo @Gex / @Wagner"
          value={`${crescimentoGex >= 0 ? "+" : ""}${formatNumber(crescimentoGex)} / ${crescimentoWagner >= 0 ? "+" : ""}${formatNumber(crescimentoWagner)}`}
          icon={TrendingUp}
          variant="orange"
        />
      </div>

      <section className="card p-5 md:p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">Posts impulsionados ({postsValidos.length}) · ordenado por CPS</h2>
        <div className="overflow-x-auto">
          <table className="dt">
            <thead>
              <tr>
                <th>ID</th>
                <th>Data</th>
                <th>Perfil</th>
                <th>Formato</th>
                <th>Status</th>
                <th className="num">Visitas</th>
                <th className="num">Seguidores +</th>
                <th className="num">Tx. conv.</th>
                <th className="num">Invest.</th>
                <th className="num">CPS</th>
              </tr>
            </thead>
            <tbody>
              {postsOrdenados.map((p) => {
                const novosSeguidores = Math.max(0, p.seguidoresApos - p.seguidoresAntes);
                return (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td className="mono">{p.data?.toLocaleDateString("pt-BR") || "—"}</td>
                    <td>{p.perfil}</td>
                    <td className="mono" style={{ color: "var(--text-dim)" }}>{p.formato}</td>
                    <td>
                      <span className="pill" style={{
                        background: p.status.toLowerCase().includes("subido") ? "rgba(52, 211, 153, 0.15)" : "rgba(148, 163, 184, 0.15)",
                        color: p.status.toLowerCase().includes("subido") ? "var(--green)" : "var(--text-dim)",
                      }}>{p.status || "—"}</span>
                    </td>
                    <td className="num">{formatNumber(p.visitaPerfil)}</td>
                    <td className="num">{formatNumber(novosSeguidores)}</td>
                    <td className="num" style={{ color: "var(--text-dim)" }}>{p.taxaConversao.toFixed(2)}%</td>
                    <td className="num">{formatBRL(p.valorGasto)}</td>
                    <td className="num" style={{ color: p.custoPorSeguidor > 0 && p.custoPorSeguidor <= 3 ? "var(--green)" : "var(--text)" }}>
                      {p.custoPorSeguidor > 0 ? formatBRL(p.custoPorSeguidor) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <CrescimentoCard titulo="@Gex" linhas={diasGex} />
        <CrescimentoCard titulo="@Wagner" linhas={diasWagner} />
      </div>
    </div>
  );
}

interface CrescimentoCardProps {
  titulo: string;
  linhas: Array<{ data: Date; inicio: number; fim: number; diferenca: number }>;
}

function CrescimentoCard({ titulo, linhas }: CrescimentoCardProps) {
  const total = linhas.reduce((s, l) => s + l.diferenca, 0);
  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <span className="mono text-sm" style={{ color: total >= 0 ? "var(--green)" : "var(--red)" }}>
          {total >= 0 ? "+" : ""}{formatNumber(total)} no período
        </span>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th>Data</th>
            <th className="num">Início</th>
            <th className="num">Fim</th>
            <th className="num">Δ</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.data.toISOString()}>
              <td className="mono">{l.data.toLocaleDateString("pt-BR")}</td>
              <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(l.inicio)}</td>
              <td className="num" style={{ color: "var(--text-dim)" }}>{formatNumber(l.fim)}</td>
              <td className="num" style={{ color: l.diferenca >= 0 ? "var(--green)" : "var(--red)" }}>
                {l.diferenca >= 0 ? "+" : ""}{l.diferenca}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
