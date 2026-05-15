import { AlertCircle } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { TrafegoCategoriaView } from "@/components/TrafegoCategoriaView";
import { carregarMetaAds, filtrarPorCategoria } from "@/lib/meta-data";
import type { AnuncioDia } from "@/lib/meta-types";

export const dynamic = "force-dynamic";

export default async function TrafegoConteudoPage() {
  let linhas: AnuncioDia[] = [];
  let erro: string | null = null;
  try {
    linhas = await carregarMetaAds();
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
  const filtradas = filtrarPorCategoria(linhas, "conteudo");
  return (
    <TrafegoCategoriaView
      linhas={filtradas}
      vazioMsg="Nenhuma campanha de Conteúdo encontrada. Critério: nome contém [CP1] ou [ENGAJAMENTO]."
    />
  );
}
