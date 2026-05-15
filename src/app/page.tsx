import Link from "next/link";
import { FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { listarAbas } from "@/lib/sheets-client";

export const revalidate = 60;

async function checkSheet(): Promise<{ ok: boolean; abas?: string[]; erro?: string }> {
  const id = process.env.GEX_SPREADSHEET_ID;
  if (!id) return { ok: false, erro: "GEX_SPREADSHEET_ID não definido" };
  try {
    const abas = await listarAbas(id);
    return { ok: true, abas };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

export default async function Home() {
  const status = await checkSheet();

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1200px] mx-auto pb-24">
      <header className="reveal mb-6">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Visão Geral</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Operação Gex — leads e vendas
        </p>
      </header>

      <section className="card p-5 md:p-6 mb-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {status.ok ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: "var(--green, #4ade80)" }} />
            ) : (
              <AlertCircle className="w-5 h-5" style={{ color: "var(--amber, #fbbf24)" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">
              {status.ok ? "Planilha conectada" : "Planilha não conectada"}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              {status.ok
                ? `${status.abas?.length ?? 0} aba(s) detectada(s) na Sheet do Gex.`
                : status.erro}
            </p>
            {!status.ok && (
              <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                Configure as variáveis <code className="font-mono">GEX_SPREADSHEET_ID</code>,{" "}
                <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> e{" "}
                <code className="font-mono">GOOGLE_SERVICE_ACCOUNT_KEY</code> (ver README).
              </p>
            )}
          </div>
          <Link
            href="/sheet"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md hover:bg-white/[0.04]"
            style={{ border: "1px solid var(--border)", color: "var(--text-dim)" }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Ver abas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-2">Próximos passos</h2>
        <ol className="text-xs space-y-2 list-decimal pl-5" style={{ color: "var(--text-dim)" }}>
          <li>Crie um Service Account no Google Cloud e habilite a Sheets API.</li>
          <li>Compartilhe a planilha do Gex com o email do Service Account (permissão de leitor).</li>
          <li>Preencha <code className="font-mono">.env.local</code> com as 3 variáveis acima.</li>
          <li>Reinicie o <code className="font-mono">npm run dev</code> — esse card vira verde.</li>
          <li>Defina os KPIs e gráficos a partir das abas detectadas em <Link href="/sheet" className="underline">/sheet</Link>.</li>
        </ol>
      </section>
    </div>
  );
}
