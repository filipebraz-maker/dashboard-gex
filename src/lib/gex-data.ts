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

export function slugParaMes(slug: string | null | undefined): string {
  if (!slug) return "TODOS";
  if (slug === "TODOS") return "TODOS";
  const decoded = decodeURIComponent(slug);
  if (decoded.includes("/")) return decoded; // já tem barra
  const m = decoded.match(/^([A-Z]+)(\d{2})$/i);
  return m ? `${m[1].toUpperCase()}/${m[2]}` : decoded.toUpperCase();
}

export function filtrarPorMes(vendas: Venda[], mes: string | null): Venda[] {
  if (!mes || mes === "TODOS") return vendas;
  return vendas.filter((v) => v.mes === mes);
}

export function filtrarLeadsPorMes(leads: LeadDiario[], mes: string | null): LeadDiario[] {
  if (!mes || mes === "TODOS") return leads;
  const idx = MESES_VENDAS.findIndex((m) => m.rotulo === mes);
  if (idx === -1) return leads;
  const mesNum = idx; // 0=jan, 1=fev, ...
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
