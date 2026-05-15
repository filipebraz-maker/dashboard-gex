export const revalidate = 60;

export default function LeadsPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-6 max-w-[1200px] mx-auto pb-24">
      <header className="reveal mb-6">
        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Leads</h1>
        <p className="text-xs md:text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          A definir após mapearmos as abas da Sheet do Gex.
        </p>
      </header>
      <section className="card p-5 md:p-6">
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>
          Aguardando: nome da aba de leads, colunas relevantes e KPIs a exibir.
        </p>
      </section>
    </div>
  );
}
