import { Sparkles, DollarSign, TrendingUp, Users, AlertCircle, Calendar } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { LineChartWrapper } from "@/components/LineChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { Pill } from "@/components/Pill";
import {
  carregarPostsAtracao,
  carregarCrescimentoGex,
  carregarCrescimentoWagner,
} from "@/lib/atracao-data";
import { formatBRL, formatNumber } from "@/lib/utils";
import type { PostAtracao, CrescimentoDia } from "@/lib/atracao-types";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function AtracaoPage() {
  let posts: PostAtracao[] = [];
  let gex: CrescimentoDia[] = [];
  let wagner: CrescimentoDia[] = [];
  let erro: string | null = null;
  try {
    [posts, gex, wagner] = await Promise.all([
      carregarPostsAtracao(),
      carregarCrescimentoGex(),
      carregarCrescimentoWagner(),
    ]);
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  if (erro) {
    return (
      <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1200px] mx-auto pb-24">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight mb-3">Atração</h1>
        <SectionCard title="Planilha de Atração indisponível">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>{erro}</p>
          </div>
        </SectionCard>
      </div>
    );
  }

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

  // Combina crescimento de Gex e Wagner por dia
  const mapaCrescimento = new Map<string, { sortKey: string; data: string; gex: number; wagner: number }>();
  for (const d of gex) {
    const sortKey = d.data.toISOString().slice(0, 10);
    const dataStr = d.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const atual = mapaCrescimento.get(dataStr) || { sortKey, data: dataStr, gex: 0, wagner: 0 };
    atual.gex += d.diferenca;
    mapaCrescimento.set(dataStr, atual);
  }
  for (const d of wagner) {
    const sortKey = d.data.toISOString().slice(0, 10);
    const dataStr = d.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const atual = mapaCrescimento.get(dataStr) || { sortKey, data: dataStr, gex: 0, wagner: 0 };
    atual.wagner += d.diferenca;
    mapaCrescimento.set(dataStr, atual);
  }
  const chartCrescimento = Array.from(mapaCrescimento.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const maxCps = Math.max(...postsValidos.map((p) => p.custoPorSeguidor), 1);
  const periodo = gex.length > 0 && wagner.length > 0
    ? `${gex[0].data.toLocaleDateString("pt-BR")} → ${gex[gex.length - 1].data.toLocaleDateString("pt-BR")}`
    : "—";

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1600px] mx-auto pb-24">
      <header className="reveal flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">Atração</h1>
          <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Posts impulsionados + crescimento dos perfis @Gex e @Wagner
          </p>
        </div>
        <div className="flex items-center gap-2 card px-3 py-2 text-sm">
          <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-dim)" }} />
          <span className="mono">{periodo}</span>
        </div>
      </header>

      <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" style={{ animationDelay: "0.05s" }}>
        <KPICard icon={DollarSign} label="Investimento" value={formatBRL(investimentoTotal)} delta={`${postsValidos.length} post(s)`} variant="purple" />
        <KPICard icon={Sparkles} label="Visitas ao Perfil" value={formatNumber(visitasTotal)} variant="cyan" />
        <KPICard icon={Users} label="Seguidores via Posts" value={`+${formatNumber(novosSeguidoresPosts)}`} delta={cpsMedio > 0 ? `CPS médio ${formatBRL(cpsMedio)}` : undefined} variant="green" />
        <KPICard icon={TrendingUp} label="Saldo total" value={`${crescimentoGex + crescimentoWagner >= 0 ? "+" : ""}${formatNumber(crescimentoGex + crescimentoWagner)}`} delta={`Gex ${crescimentoGex >= 0 ? "+" : ""}${crescimentoGex} · Wagner ${crescimentoWagner >= 0 ? "+" : ""}${crescimentoWagner}`} deltaColor={crescimentoGex + crescimentoWagner >= 0 ? "var(--green)" : "var(--red)"} />
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.1s" }}>
        <SectionCard title="Crescimento Diário dos Perfis" subtitle="Δ seguidores por dia">
          {chartCrescimento.length > 0 ? (
            <LineChartWrapper
              data={chartCrescimento}
              xKey="data"
              lines={[
                { key: "gex", color: "#22D3EE", name: "@Gex" },
                { key: "wagner", color: "#A78BFA", name: "@Wagner" },
              ]}
              format="number"
              height={300}
            />
          ) : (
            <div className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>Sem dados de crescimento</div>
          )}
        </SectionCard>
      </div>

      <div className="reveal mb-5" style={{ animationDelay: "0.15s" }}>
        <SectionCard title="Posts Impulsionados" subtitle={`${postsValidos.length} post(s) · ordenado por CPS (menor primeiro)`}>
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="min-w-[800px] px-4 md:px-5">
              <table className="dt">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Perfil</th>
                    <th>Formato</th>
                    <th>Status</th>
                    <th className="text-right">Visitas</th>
                    <th className="text-right">Seg. +</th>
                    <th className="text-right">Invest.</th>
                    <th className="text-right">CPS</th>
                  </tr>
                </thead>
                <tbody>
                  {postsOrdenados.map((p) => {
                    const novosSeguidores = Math.max(0, p.seguidoresApos - p.seguidoresAntes);
                    return (
                      <tr key={p.id}>
                        <td><span className="mono" style={{ color: "var(--text-muted)" }}>{p.id}</span></td>
                        <td className="mono">{p.data?.toLocaleDateString("pt-BR") || "—"}</td>
                        <td>{p.perfil}</td>
                        <td className="mono" style={{ color: "var(--text-dim)" }}>{p.formato}</td>
                        <td>
                          <Pill tone={p.status.toLowerCase().includes("subido") ? "green" : p.status.toLowerCase().includes("pausado") ? "neutral" : "cyan"}>
                            {p.status || "—"}
                          </Pill>
                        </td>
                        <td className="num">{formatNumber(p.visitaPerfil)}</td>
                        <td className="num" style={{ color: "var(--cyan)" }}>{formatNumber(novosSeguidores)}</td>
                        <td className="num">{formatBRL(p.valorGasto)}</td>
                        <td className="num">
                          <div className="flex items-center justify-end gap-2">
                            <span style={{ color: p.custoPorSeguidor > 0 && p.custoPorSeguidor <= 2 ? "var(--green)" : p.custoPorSeguidor <= 3 ? "var(--amber)" : "var(--text)" }}>
                              {p.custoPorSeguidor > 0 ? formatBRL(p.custoPorSeguidor) : "—"}
                            </span>
                          </div>
                          {p.custoPorSeguidor > 0 && (
                            <HeatBar value={(p.custoPorSeguidor / maxCps) * 100} color={p.custoPorSeguidor <= 2 ? "green" : p.custoPorSeguidor <= 3 ? "amber" : "orange"} className="mt-1" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
