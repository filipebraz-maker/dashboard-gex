import { listarAbas } from "@/lib/sheets-client";

export const revalidate = 60;

export default async function SheetPage() {
  const id = process.env.GEX_SPREADSHEET_ID;
  let abas: string[] = [];
  let erro: string | null = null;
  if (!id) {
    erro = "GEX_SPREADSHEET_ID não definido";
  } else {
    try {
      abas = await listarAbas(id);
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1200px] mx-auto pb-24">
      <header className="reveal mb-6">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Planilha</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Abas detectadas na Sheet do Gex.
        </p>
      </header>

      {erro ? (
        <section className="card p-5 md:p-6">
          <div className="text-sm font-semibold mb-1">Erro ao conectar</div>
          <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--text-dim)" }}>
            {erro}
          </pre>
        </section>
      ) : (
        <section className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>
            {abas.length} aba(s)
          </div>
          <ul className="space-y-1.5">
            {abas.map((nome) => (
              <li
                key={nome}
                className="px-3 py-2 rounded-md text-sm font-mono"
                style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}
              >
                {nome}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
