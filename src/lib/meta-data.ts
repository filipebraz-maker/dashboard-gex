import { lerAba } from "./sheets-client";
import { parseValor } from "./gex-parsers";
import type { AnuncioDia } from "./meta-types";

const ABA = "db_geral_meta";

function spreadsheetId(): string {
  const id = process.env.GEX_META_SHEET_ID;
  if (!id) throw new Error("GEX_META_SHEET_ID não definido");
  return id;
}

function parseDataIso(raw: string): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

function parseNumeric(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export type CategoriaCampanha = "captacao" | "atracao" | "conteudo" | "outros";

export const CATEGORIAS_META: Array<{ slug: CategoriaCampanha; rotulo: string; descricao: string }> = [
  { slug: "captacao", rotulo: "Captação", descricao: "Campanhas com foco em leads (CONVERSÃO/LEAD)" },
  { slug: "atracao", rotulo: "Atração", descricao: "Posts impulsionados pra crescer perfil ([CT] [ATRAÇÃO])" },
  { slug: "conteudo", rotulo: "Conteúdo", descricao: "Distribuição de conteúdo ([CP1] / [ENGAJAMENTO])" },
  { slug: "outros", rotulo: "Outros", descricao: "Campanhas que não se enquadram nas categorias acima" },
];

export function classificarCampanha(nome: string): CategoriaCampanha {
  const n = (nome || "").toUpperCase();
  // Atração tem precedência: campanhas com [ATRAÇÃO] mesmo se tiverem [CT] vão pra atração
  if (n.includes("[ATRAÇÃO]") || n.includes("[ATRACAO]")) return "atracao";
  if (n.includes("CONVERSÃO") || n.includes("CONVERSAO") || n.includes("LEAD")) return "captacao";
  if (n.includes("[CP1]") || n.includes("[ENGAJAMENTO]")) return "conteudo";
  return "outros";
}

export function filtrarPorCategoria(linhas: AnuncioDia[], categoria: CategoriaCampanha | "todos"): AnuncioDia[] {
  if (categoria === "todos") return linhas;
  return linhas.filter((l) => classificarCampanha(l.campanha) === categoria);
}

export function contarPorCategoria(linhas: AnuncioDia[]): Record<CategoriaCampanha, { linhas: number; investimento: number; campanhas: number }> {
  const out: Record<CategoriaCampanha, { linhas: number; investimento: number; campanhas: number }> = {
    captacao: { linhas: 0, investimento: 0, campanhas: 0 },
    atracao: { linhas: 0, investimento: 0, campanhas: 0 },
    conteudo: { linhas: 0, investimento: 0, campanhas: 0 },
    outros: { linhas: 0, investimento: 0, campanhas: 0 },
  };
  const campanhasPorCat: Record<CategoriaCampanha, Set<string>> = {
    captacao: new Set(),
    atracao: new Set(),
    conteudo: new Set(),
    outros: new Set(),
  };
  for (const l of linhas) {
    const cat = classificarCampanha(l.campanha);
    out[cat].linhas++;
    out[cat].investimento += l.investimento;
    campanhasPorCat[cat].add(l.campanha);
  }
  for (const c of Object.keys(out) as CategoriaCampanha[]) {
    out[c].campanhas = campanhasPorCat[c].size;
  }
  return out;
}

export async function carregarMetaAds(): Promise<AnuncioDia[]> {
  const rows = await lerAba(spreadsheetId(), ABA, "A:AZ");
  if (rows.length < 2) return [];
  const out: AnuncioDia[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const dia = parseDataIso(r[0] || "");
    if (!dia) continue;
    out.push({
      dia,
      impressoes: parseNumeric(r[1] || ""),
      alcance: parseNumeric(r[2] || ""),
      investimento: parseValor(r[3] || ""),
      cliques: parseNumeric(r[4] || ""),
      visualizacoesLP: parseNumeric(r[5] || ""),
      frequencia: parseNumeric(r[6] || ""),
      registrosCompletos: parseNumeric(r[7] || ""),
      cpm: parseValor(r[8] || ""),
      cpc: parseValor(r[9] || ""),
      ctr: parseNumeric(r[10] || ""),
      campanha: (r[11] || "").trim(),
      thruPlay: parseNumeric(r[12] || ""),
      video25: parseNumeric(r[13] || ""),
      video50: parseNumeric(r[14] || ""),
      video75: parseNumeric(r[15] || ""),
      anuncio: (r[16] || "").trim(),
      conjunto: (r[17] || "").trim(),
      permalink: (r[18] || "").trim(),
      checkouts: parseNumeric(r[19] || ""),
      vendasMeta: parseNumeric(r[20] || ""),
      thumbnail: (r[21] || "").trim(),
      status: (r[22] || "").trim(),
      conversasIniciadas: parseNumeric(r[23] || ""),
    });
  }
  return out;
}

export interface ResumoMeta {
  investimentoTotal: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversasIniciadas: number;
  registrosCompletos: number;
  vendasMeta: number;
  diaIni: Date | null;
  diaFim: Date | null;
}

export function resumirMeta(linhas: AnuncioDia[]): ResumoMeta {
  const investimentoTotal = linhas.reduce((s, l) => s + l.investimento, 0);
  const impressoes = linhas.reduce((s, l) => s + l.impressoes, 0);
  const alcance = linhas.reduce((s, l) => s + l.alcance, 0);
  const cliques = linhas.reduce((s, l) => s + l.cliques, 0);
  const conversasIniciadas = linhas.reduce((s, l) => s + l.conversasIniciadas, 0);
  const registrosCompletos = linhas.reduce((s, l) => s + l.registrosCompletos, 0);
  const vendasMeta = linhas.reduce((s, l) => s + l.vendasMeta, 0);
  const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
  const cpc = cliques > 0 ? investimentoTotal / cliques : 0;
  const cpm = impressoes > 0 ? (investimentoTotal / impressoes) * 1000 : 0;
  const datas = linhas.map((l) => l.dia.getTime()).sort((a, b) => a - b);
  const diaIni = datas.length > 0 ? new Date(datas[0]) : null;
  const diaFim = datas.length > 0 ? new Date(datas[datas.length - 1]) : null;
  return {
    investimentoTotal,
    impressoes,
    alcance,
    cliques,
    ctr,
    cpc,
    cpm,
    conversasIniciadas,
    registrosCompletos,
    vendasMeta,
    diaIni,
    diaFim,
  };
}

export function agruparPorAnuncio(linhas: AnuncioDia[]) {
  const mapa = new Map<string, {
    anuncio: string;
    campanha: string;
    investimento: number;
    impressoes: number;
    cliques: number;
    conversasIniciadas: number;
    vendasMeta: number;
    thumbnail: string;
  }>();
  for (const l of linhas) {
    const chave = l.anuncio || "(sem nome)";
    const atual = mapa.get(chave) || {
      anuncio: chave,
      campanha: l.campanha,
      investimento: 0,
      impressoes: 0,
      cliques: 0,
      conversasIniciadas: 0,
      vendasMeta: 0,
      thumbnail: l.thumbnail,
    };
    atual.investimento += l.investimento;
    atual.impressoes += l.impressoes;
    atual.cliques += l.cliques;
    atual.conversasIniciadas += l.conversasIniciadas;
    atual.vendasMeta += l.vendasMeta;
    if (!atual.thumbnail && l.thumbnail) atual.thumbnail = l.thumbnail;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.investimento - a.investimento);
}

export function metaPorDia(linhas: AnuncioDia[]): Array<{
  data: string;
  sortKey: string;
  investimento: number;
  cliques: number;
  conversas: number;
  impressoes: number;
}> {
  const mapa = new Map<string, { sortKey: string; investimento: number; cliques: number; conversas: number; impressoes: number }>();
  for (const l of linhas) {
    const sortKey = l.dia.toISOString().slice(0, 10);
    const data = l.dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const atual = mapa.get(data) || { sortKey, investimento: 0, cliques: 0, conversas: 0, impressoes: 0 };
    atual.investimento += l.investimento;
    atual.cliques += l.cliques;
    atual.conversas += l.conversasIniciadas;
    atual.impressoes += l.impressoes;
    mapa.set(data, atual);
  }
  return Array.from(mapa.entries())
    .map(([data, d]) => ({ data, ...d }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function agruparPorCampanha(linhas: AnuncioDia[]) {
  const mapa = new Map<string, {
    campanha: string;
    investimento: number;
    impressoes: number;
    cliques: number;
    conversasIniciadas: number;
    vendasMeta: number;
  }>();
  for (const l of linhas) {
    const chave = l.campanha || "(sem nome)";
    const atual = mapa.get(chave) || {
      campanha: chave,
      investimento: 0,
      impressoes: 0,
      cliques: 0,
      conversasIniciadas: 0,
      vendasMeta: 0,
    };
    atual.investimento += l.investimento;
    atual.impressoes += l.impressoes;
    atual.cliques += l.cliques;
    atual.conversasIniciadas += l.conversasIniciadas;
    atual.vendasMeta += l.vendasMeta;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.investimento - a.investimento);
}
