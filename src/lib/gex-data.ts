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
