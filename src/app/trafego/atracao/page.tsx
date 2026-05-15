import { AlertCircle, Sparkles, Users, DollarSign, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { SectionCard } from "@/components/SectionCard";
import { LineChartWrapper } from "@/components/LineChartWrapper";
import { HeatBar } from "@/components/HeatBar";
import { Pill } from "@/components/Pill";
import { TrafegoCategoriaView } from "@/components/TrafegoCategoriaView";
import { carregarMetaAds, filtrarPorCategoria } from "@/lib/meta-data";
import {
  carregarPostsAtracao,
  carregarCrescimentoGex,
  carregarCrescimentoWagner,
} from "@/lib/atracao-data";
import type { AnuncioDia } from "@/lib/meta-types";
import type { PostAtracao, CrescimentoDia } from "@/lib/atracao-types";
import { formatBRL, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrafegoAtracaoPage() {
  let linhas: AnuncioDia[] = [];
  let posts: PostAtracao[] = [];
  let gex: CrescimentoDia[] = [];
  let wagner: CrescimentoDia[] = [];
  let erro: string | null = null;

  try {
    [linhas, posts, gex, wagner] = await Promise.all([
      carregarMetaAds(),
      carregarPostsAtracao().catch(() => []),
      carregarCrescimentoGex().catch(() => []),
      carregarCrescimentoWagner().catch(() => []),
    ]);
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  if (erro) {
    return (
      <SectionCard title="Meta Ads indisponível">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
          <p className="text-xs" style={{ color: "var(--text-dim)" }}>{erro}</p>
        </div>
      </SectionCard>
    );
  }

  const filtradas = filtrarPorCategoria(linhas, "atracao");

  const postsValidos = posts.filter((p) => p.valorGasto > 0);
  const novosSeguidoresPosts = postsValidos.reduce(
    (s, p) => s + Math.max(0, p.seguidoresApos - p.seguidoresAntes),
    0
  );
  const investimentoPosts = postsValidos.reduce((s, p) => s + p.valorGasto, 0);
  const cpsMedio = novosSeguidoresPosts > 0 ? investimentoPosts / novosSeguidoresPosts : 0;
  const crescimentoGex = gex.reduce((s, d) => s + d.diferenca, 0);
  const crescimentoWagner = wagner.reduce((s, d) => s + d.diferenca, 0);

  // Combina crescimento de Gex e Wagner por dia pro chart
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

  const postsOrdenados = [...postsValidos].sort(
    (a, b) => (a.custoPorSeguidor || Infinity) - (b.custoPorSeguidor || Infinity)
  );
  const maxCps = Math.max(...postsValidos.map((p) => p.custoPorSeguidor), 1);

  const extraTopo = (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard icon={DollarSign} label="Invest. Posts (planilha)" value={formatBRL(investimentoPosts)} delta={`${postsValidos.length} post(s)`} variant="purple" />
        <KPICard icon={Sparkles} label="Visitas ao Perfil" value={formatNumber(postsValidos.reduce((s, p) => s + p.visitaPerfil, 0))} variant="cyan" />
        <KPICard icon={Users} label="Seguidores via Posts" value={`+${formatNumber(novosSeguidoresPosts)}`} delta={cpsMedio > 0 ? `CPS médio ${formatBRL(cpsMedio)}` : undefined} variant="green" />
        <KPICard
          icon={TrendingUp}
          label="Saldo @Gex + @Wagner"
          value={`${crescimentoGex + crescimentoWagner >= 0 ? "+" : ""}${formatNumber(crescimentoGex + crescimentoWagner)}`}
          delta={`Gex ${crescimentoGex >= 0 ? "+" : ""}${crescimentoGex} · Wagner ${crescimentoWagner >= 0 ? "+" : ""}${crescimentoWagner}`}
          deltaColor={crescimentoGex + crescimentoWagner >= 0 ? "var(--green)" : "var(--red)"}
        />
      </div>

      {chartCrescimento.length > 0 && (
        <div className="mb-5">
          <SectionCard title="Crescimento Diário dos Perfis" subtitle="Δ seguidores @Gex × @Wagner">
            <LineChartWrapper
              data={chartCrescimento}
              xKey="data"
              lines={[
                { key: "gex", color: "#22D3EE", name: "@Gex" },
                { key: "wagner", color: "#A78BFA", name: "@Wagner" },
              ]}
              format="number"
              height={260}
            />
          </SectionCard>
        </div>
      )}

      {postsValidos.length > 0 && (
        <div className="mb-5">
          <SectionCard title="Posts Impulsionados (planilha)" subtitle={`${postsValidos.length} post(s) · ordenado por CPS`}>
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
                            <span style={{ color: p.custoPorSeguidor > 0 && p.custoPorSeguidor <= 2 ? "var(--green)" : p.custoPorSeguidor <= 3 ? "var(--amber)" : "var(--text)" }}>
                              {p.custoPorSeguidor > 0 ? formatBRL(p.custoPorSeguidor) : "—"}
                            </span>
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
      )}

      <div className="mb-2 mt-6">
        <h2 className="text-sm font-semibold mb-1">Campanhas Meta — Categoria Atração</h2>
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Filtro automático: nome da campanha Meta contém <span className="mono">[ATRAÇÃO]</span>
        </p>
      </div>
    </>
  );

  return (
    <TrafegoCategoriaView
      linhas={filtradas}
      vazioMsg="Nenhuma campanha Meta de Atração encontrada. Critério: nome contém [ATRAÇÃO]."
      extraTopo={extraTopo}
    />
  );
}
