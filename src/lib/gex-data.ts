import { lerAba } from "./sheets-client";
import { parseAbaVendas, parseRelatorioDiario } from "./gex-parsers";
import type { LeadDiario, Venda } from "./gex-types";

const ABA_RELATORIO = "RELATÓRIO DIÁRIO";

export const MESES_VENDAS: { aba: string; rotulo: string }[] = [
  { aba: "VENDAS JAN/26", rotulo: "JAN/26" },
  { aba: "VENDAS FEV/26", rotulo: "FEV/26" },
  { aba: "VENDAS MAR/26", rotulo: "MAR/26" },
  { aba: "VENDAS ABR/26", rotulo: "ABR/26" },
  { aba: "VENDAS MAIO/26", rotulo: "MAIO/26" },
];

function spreadsheetId(): string {
  const id = process.env.GEX_SPREADSHEET_ID;
  if (!id) throw new Error("GEX_SPREADSHEET_ID não definido");
  return id;
}

export async function carregarVendas(): Promise<Venda[]> {
  const id = spreadsheetId();
  const lotes = await Promise.all(
    MESES_VENDAS.map(async ({ aba, rotulo }) => {
      const rows = await lerAba(id, aba);
      return parseAbaVendas(rows, rotulo);
    })
  );
  return lotes.flat();
}

export async function carregarLeadsDiarios(): Promise<LeadDiario[]> {
  const id = spreadsheetId();
  const rows = await lerAba(id, ABA_RELATORIO);
  return parseRelatorioDiario(rows);
}

export interface Resumo {
  faturamentoBruto: number;
  faturamentoLiquido: number;
  qtdVendasBrutas: number;
  qtdVendasLiquidas: number;
  qtdCanceladas: number;
  valorCancelado: number;
  totalLeads: number;
  ticketMedio: number;
  taxaConversao: number;
  cicloMedio: number;
}

export function resumir(vendas: Venda[], leads: LeadDiario[]): Resumo {
  const ativas = vendas.filter((v) => !v.cancelada);
  const canceladas = vendas.filter((v) => v.cancelada);
  const faturamentoBruto = vendas.reduce((s, v) => s + v.valor, 0);
  const valorCancelado = canceladas.reduce((s, v) => s + v.valor, 0);
  const faturamentoLiquido = faturamentoBruto - valorCancelado;
  const ticketMedio = ativas.length > 0 ? faturamentoLiquido / ativas.length : 0;
  const totalLeads = leads.reduce((s, l) => s + l.totalLeads, 0);
  const taxaConversao = totalLeads > 0 ? (ativas.length / totalLeads) * 100 : 0;
  const comTempo = ativas.filter((v) => v.tempo !== null && v.tempo >= 0);
  const cicloMedio =
    comTempo.length > 0
      ? comTempo.reduce((s, v) => s + (v.tempo || 0), 0) / comTempo.length
      : 0;
  return {
    faturamentoBruto,
    faturamentoLiquido,
    qtdVendasBrutas: vendas.length,
    qtdVendasLiquidas: ativas.length,
    qtdCanceladas: canceladas.length,
    valorCancelado,
    totalLeads,
    ticketMedio,
    taxaConversao,
    cicloMedio,
  };
}

// ===== Períodos / Filtros por range =====

export interface PeriodoRange {
  inicio: Date;
  fim: Date;
  key: string;
  label: string;
}

interface MesEntry {
  key: string;
  mes: string; // formato interno "JAN/26"
  label: string; // label exibido
  monthIdx: number; // 0..11
  ano: number;
}

const MESES_KEYS: MesEntry[] = [
  { key: "jan26", mes: "JAN/26", label: "Janeiro/26", monthIdx: 0, ano: 2026 },
  { key: "fev26", mes: "FEV/26", label: "Fevereiro/26", monthIdx: 1, ano: 2026 },
  { key: "mar26", mes: "MAR/26", label: "Março/26", monthIdx: 2, ano: 2026 },
  { key: "abr26", mes: "ABR/26", label: "Abril/26", monthIdx: 3, ano: 2026 },
  { key: "maio26", mes: "MAIO/26", label: "Maio/26", monthIdx: 4, ano: 2026 },
];

export const PERIODO_OPTIONS: { key: string; label: string }[] = [
  { key: "todos", label: "Todos os meses" },
  ...MESES_KEYS.map((m) => ({ key: m.key, label: m.label })),
];

function formatBR(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function getPeriodoFromQuery(mes?: string, de?: string, ate?: string): PeriodoRange {
  // Custom range
  if (mes === "custom" && de && ate) {
    const [yi, mi, di] = de.split("-").map(Number);
    const [yf, mf, df] = ate.split("-").map(Number);
    return {
      inicio: new Date(yi, mi - 1, di, 0, 0, 0),
      fim: new Date(yf, mf - 1, df, 23, 59, 59),
      key: "custom",
      label: `${formatBR(de)} → ${formatBR(ate)}`,
    };
  }
  // Mês específico
  const entry = MESES_KEYS.find((m) => m.key === mes);
  if (entry) {
    const inicio = new Date(entry.ano, entry.monthIdx, 1, 0, 0, 0);
    const fim = new Date(entry.ano, entry.monthIdx + 1, 0, 23, 59, 59);
    return { inicio, fim, key: entry.key, label: entry.label };
  }
  // Default: todos os meses cobertos
  const ultimo = MESES_KEYS[MESES_KEYS.length - 1];
  const inicio = new Date(MESES_KEYS[0].ano, MESES_KEYS[0].monthIdx, 1, 0, 0, 0);
  const fim = new Date(ultimo.ano, ultimo.monthIdx + 1, 0, 23, 59, 59);
  return { inicio, fim, key: "todos", label: "Todos os meses" };
}

export function filtrarVendasPorRange(vendas: Venda[], r: PeriodoRange): Venda[] {
  return vendas.filter((v) => v.dataVenda >= r.inicio && v.dataVenda <= r.fim);
}

export function filtrarLeadsPorRange(leads: LeadDiario[], r: PeriodoRange): LeadDiario[] {
  return leads.filter((l) => l.data >= r.inicio && l.data <= r.fim);
}

// Legacy compat (alguns trechos antigos ainda chamam)
export function slugParaMes(slug: string | null | undefined): string {
  if (!slug || slug === "todos" || slug === "TODOS") return "TODOS";
  const entry = MESES_KEYS.find((m) => m.key === slug || m.mes === slug);
  return entry ? entry.mes : "TODOS";
}

export function filtrarPorMes(vendas: Venda[], mes: string | null): Venda[] {
  if (!mes || mes === "TODOS") return vendas;
  return vendas.filter((v) => v.mes === mes);
}

export function filtrarLeadsPorMes(leads: LeadDiario[], mes: string | null): LeadDiario[] {
  if (!mes || mes === "TODOS") return leads;
  const idx = MESES_VENDAS.findIndex((m) => m.rotulo === mes);
  if (idx === -1) return leads;
  const mesNum = idx;
  return leads.filter((l) => l.data.getMonth() === mesNum && l.data.getFullYear() === 2026);
}

export function vendasPorDia(vendas: Venda[]): Array<{ data: string; sortKey: string; faturamento: number; qtd: number }> {
  const mapa = new Map<string, { sortKey: string; faturamento: number; qtd: number }>();
  for (const v of vendas) {
    if (v.cancelada) continue;
    const sortKey = v.dataVenda.toISOString().slice(0, 10);
    const data = v.dataVenda.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const atual = mapa.get(data) || { sortKey, faturamento: 0, qtd: 0 };
    atual.faturamento += v.valor;
    atual.qtd++;
    mapa.set(data, atual);
  }
  return Array.from(mapa.entries())
    .map(([data, d]) => ({ data, ...d }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function leadsPorDia(leads: LeadDiario[]): Array<{ data: string; sortKey: string; leads: number; vendas: number }> {
  return leads
    .filter((l) => l.totalLeads > 0 || l.vendasContagem > 0)
    .map((l) => ({
      sortKey: l.data.toISOString().slice(0, 10),
      data: l.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: l.totalLeads,
      vendas: l.vendasContagem,
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function faturamentoPorMes(vendas: Venda[]): Array<{ mes: string; faturamento: number; qtd: number }> {
  const ordem = MESES_VENDAS.map((m) => m.rotulo);
  const mapa = new Map<string, { faturamento: number; qtd: number }>();
  for (const r of ordem) mapa.set(r, { faturamento: 0, qtd: 0 });
  for (const v of vendas) {
    if (v.cancelada) continue;
    const atual = mapa.get(v.mes);
    if (!atual) continue;
    atual.faturamento += v.valor;
    atual.qtd++;
  }
  return ordem.map((mes) => ({ mes, ...(mapa.get(mes) || { faturamento: 0, qtd: 0 }) }));
}

export interface ResumoQuinzena {
  rotulo: string;
  diaInicio: number;
  diaFim: number;
  dias: LeadDiario[];
  totalPorOrigem: Record<string, number>;
  totalLeads: number;
  totalVendas: number;
  totalFollowUp: number;
}

export interface RelatorioMes {
  mesNum: number;
  rotulo: string;
  origens: string[];
  quinzenas: [ResumoQuinzena, ResumoQuinzena];
  totalMes: { leads: number; vendas: number; followUp: number; porOrigem: Record<string, number> };
}

const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function origensDoMes(dias: LeadDiario[]): string[] {
  const set = new Set<string>();
  for (const d of dias) for (const o of Object.keys(d.porOrigem)) set.add(o);
  const prioridade = ["BIO", "WAGNER", "DIRECT", "ADS IN", "ADS AV", "YOUTUBE", "GRUPO", "SITE", "GEX ADM", "ADEMIR", "JANAINA", "IND. AMIGO"];
  return [...set].sort((a, b) => {
    const ia = prioridade.indexOf(a);
    const ib = prioridade.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function totalizaQuinzena(dias: LeadDiario[]): Omit<ResumoQuinzena, "rotulo" | "diaInicio" | "diaFim" | "dias"> {
  const totalPorOrigem: Record<string, number> = {};
  let totalLeads = 0;
  let totalVendas = 0;
  let totalFollowUp = 0;
  for (const d of dias) {
    for (const [o, n] of Object.entries(d.porOrigem)) {
      totalPorOrigem[o] = (totalPorOrigem[o] || 0) + n;
    }
    totalLeads += d.totalLeads;
    totalVendas += d.vendasContagem;
    totalFollowUp += d.followUpCount;
  }
  return { totalPorOrigem, totalLeads, totalVendas, totalFollowUp };
}

export function quinzenarRelatorio(leads: LeadDiario[]): RelatorioMes[] {
  const porMes = new Map<number, LeadDiario[]>();
  for (const l of leads) {
    const m = l.data.getMonth();
    const arr = porMes.get(m) || [];
    arr.push(l);
    porMes.set(m, arr);
  }
  const meses: RelatorioMes[] = [];
  for (const [mesNum, dias] of [...porMes.entries()].sort((a, b) => a[0] - b[0])) {
    const ordenados = [...dias].sort((a, b) => a.data.getTime() - b.data.getTime());
    const primeira = ordenados.filter((d) => d.data.getDate() <= 15);
    const segunda = ordenados.filter((d) => d.data.getDate() > 15);
    const q1: ResumoQuinzena = { rotulo: "1ª Quinzena", diaInicio: 1, diaFim: 15, dias: primeira, ...totalizaQuinzena(primeira) };
    const q2: ResumoQuinzena = {
      rotulo: "2ª Quinzena",
      diaInicio: 16,
      diaFim: segunda.length > 0 ? segunda[segunda.length - 1].data.getDate() : 31,
      dias: segunda,
      ...totalizaQuinzena(segunda),
    };
    const totalMesAgg = totalizaQuinzena(ordenados);
    meses.push({
      mesNum,
      rotulo: NOMES_MESES[mesNum],
      origens: origensDoMes(ordenados),
      quinzenas: [q1, q2],
      totalMes: {
        leads: totalMesAgg.totalLeads,
        vendas: totalMesAgg.totalVendas,
        followUp: totalMesAgg.totalFollowUp,
        porOrigem: totalMesAgg.totalPorOrigem,
      },
    });
  }
  return meses;
}

export function origemLeadsAgregado(leads: LeadDiario[]): Array<{ origem: string; leads: number; percentual: number }> {
  const mapa: Record<string, number> = {};
  let total = 0;
  for (const l of leads) {
    for (const [o, n] of Object.entries(l.porOrigem)) {
      mapa[o] = (mapa[o] || 0) + n;
      total += n;
    }
  }
  return Object.entries(mapa)
    .map(([origem, leads]) => ({
      origem,
      leads,
      percentual: total > 0 ? (leads / total) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);
}

export function agruparPorChave<K extends string>(
  vendas: Venda[],
  chave: (v: Venda) => K | null
): Array<{ chave: K; qtd: number; valor: number; qtdCanc: number; valorCanc: number }> {
  const mapa = new Map<K, { qtd: number; valor: number; qtdCanc: number; valorCanc: number }>();
  for (const v of vendas) {
    const k = chave(v);
    if (k === null) continue;
    const atual = mapa.get(k) || { qtd: 0, valor: 0, qtdCanc: 0, valorCanc: 0 };
    if (v.cancelada) {
      atual.qtdCanc++;
      atual.valorCanc += v.valor;
    } else {
      atual.qtd++;
      atual.valor += v.valor;
    }
    mapa.set(k, atual);
  }
  return Array.from(mapa.entries())
    .map(([chave, dados]) => ({ chave, ...dados }))
    .sort((a, b) => b.valor - a.valor);
}
