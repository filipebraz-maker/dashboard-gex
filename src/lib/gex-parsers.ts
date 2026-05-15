import type { Area, ProdutoBase, Venda, LeadDiario } from "./gex-types";

const ORIGENS_CONHECIDAS = new Set([
  "BIO", "WAGNER", "DIRECT", "ADS IN", "ADS AV", "YOUTUBE", "GRUPO",
  "SITE", "GEX ADM", "ADEMIR", "JANAINA", "IND. AMIGO", "FOLLOW-UP",
  "EX ALUNO", "IND.AMIGO",
]);

export function normalizarOrigem(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (!s) return "";
  if (s === "FOLLOW UP") return "FOLLOW-UP";
  if (s === "IND.AMIGO") return "IND. AMIGO";
  if (s === "YT") return "YOUTUBE";
  if (s === "IG") return "BIO";
  return s;
}

export function parseValor(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function parseInt2(raw: string): number {
  if (!raw) return 0;
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

export function parseIntSigned(raw: string): number {
  if (!raw) return 0;
  const s = raw.trim();
  const neg = s.startsWith("-");
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}

export function parseData(raw: string): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const ano = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
  return new Date(ano, parseInt(mo, 10) - 1, parseInt(d, 10));
}

export function parseTipos(raw: string): { tipos: string[]; cancelada: boolean } {
  if (!raw) return { tipos: [], cancelada: false };
  const tipos = raw
    .split(/[,;/]/)
    .map((t) => t.trim().toUpperCase())
    .map((t) => (t === "RENOVAÇAO" ? "RENOVAÇÃO" : t))
    .filter(Boolean);
  const cancelada = tipos.some((t) => t.includes("CANCEL"));
  return { tipos, cancelada };
}

function classificarProduto(texto: string): ProdutoBase {
  const t = texto.toUpperCase();
  if (t.includes("ANUAL")) return "ANUAL";
  if (t.includes("SEMESTRAL")) return "SEMESTRAL";
  if (t.includes("TRIMESTRAL")) return "TRIMESTRAL";
  if (t.includes("RECORRENTE")) return "RECORRENTE";
  return "OUTRO";
}

function extrairAreaDoProduto(texto: string): Area | null {
  const t = texto.toUpperCase();
  if (t.includes("ADMINISTRATIV")) return "ADMINISTRATIVO";
  if (t.includes("FISCAL")) return "FISCAL";
  if (t.includes("CONTROLE")) return "CONTROLE";
  return null;
}

function normalizarArea(raw: string): Area | null {
  const t = raw.trim().toUpperCase();
  if (t.startsWith("ADMINISTRATIV")) return "ADMINISTRATIVO";
  if (t.startsWith("FISCAL")) return "FISCAL";
  if (t.startsWith("CONTROLE")) return "CONTROLE";
  return null;
}

function acharLinhaCabecalho(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i] || [];
    const first = (row[0] || "").trim().toUpperCase();
    if (first === "DATA" || first === "DATA DE INICIO" || first === "DATA DE INÍCIO" || first === "CONVERSA") {
      return i;
    }
  }
  return -1;
}

interface ColunaMap {
  dataInicio: number;
  dataVenda: number;
  aluno: number;
  produto: number;
  area: number;
  tipo: number;
  origem: number;
  valor: number;
  tempo: number;
  obs: number;
  produtoTemArea: boolean;
}

function mapearColunas(header: string[]): ColunaMap {
  const idx = (...nomes: string[]): number => {
    for (const n of nomes) {
      const i = header.findIndex((h) => (h || "").trim().toUpperCase() === n.toUpperCase());
      if (i !== -1) return i;
    }
    return -1;
  };
  const produtoIdx = idx("PRODUTO", "PRODUTO/AREA", "PRODUTO/ÁREA");
  const produtoHeader = (header[produtoIdx] || "").toUpperCase();
  return {
    dataInicio: idx("DATA DE INICIO", "DATA DE INÍCIO", "DATA DE INICIO ", "CONVERSA", "DATA INICIO"),
    dataVenda: idx("DATA DA VENDA", "DATA VENDA", "VENDA"),
    aluno: idx("ALUNO", "ALUNO (A)", "ALUNO(A)"),
    produto: produtoIdx,
    area: idx("ÁREA", "AREA"),
    tipo: idx("TIPO"),
    origem: idx("ORIGEM"),
    valor: idx("VALOR"),
    tempo: idx("TEMPO"),
    obs: idx("OBS", "OBSERVAÇÃO", "OBSERVACAO"),
    produtoTemArea: produtoHeader.includes("/"),
  };
}

export function parseAbaVendas(rows: string[][], mes: string): Venda[] {
  const headerIdx = acharLinhaCabecalho(rows);
  if (headerIdx === -1) return [];
  const cols = mapearColunas(rows[headerIdx]);
  const out: Venda[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const dataVendaRaw = cols.dataVenda >= 0 ? row[cols.dataVenda] : "";
    const dataVenda = parseData(dataVendaRaw || "");
    if (!dataVenda) continue;
    const aluno = (row[cols.aluno] || "").trim();
    if (!aluno) continue;

    const produtoRaw = (row[cols.produto] || "").trim();
    const areaRaw = cols.area >= 0 ? (row[cols.area] || "").trim() : "";
    const area = areaRaw ? normalizarArea(areaRaw) : extrairAreaDoProduto(produtoRaw);
    const valor = parseValor(row[cols.valor] || "");
    const { tipos, cancelada } = parseTipos(row[cols.tipo] || "");
    const origem = normalizarOrigem(row[cols.origem] || "");
    const dataInicio = cols.dataInicio >= 0 ? parseData(row[cols.dataInicio] || "") : null;
    const tempoRaw = cols.tempo >= 0 ? row[cols.tempo] : "";
    const tempo = tempoRaw ? parseInt2(tempoRaw) : null;
    const obs = cols.obs >= 0 ? (row[cols.obs] || "").trim() : "";

    out.push({
      dataInicio,
      dataVenda,
      aluno,
      produto: produtoRaw,
      produtoBase: classificarProduto(produtoRaw),
      area,
      tipos,
      origem,
      valor,
      tempo,
      obs,
      cancelada,
      mes,
    });
  }
  return out;
}

function ehLinhaTotal(primeiraCelula: string): boolean {
  const t = primeiraCelula.trim().toUpperCase();
  return (
    t.startsWith("TOTAL") ||
    t.startsWith("TOTAIS") ||
    t.startsWith("LEADS TOTAIS") ||
    t.startsWith("VENDAS TOTAIS") ||
    t.startsWith("CONVERSÃO") ||
    t.startsWith("TAXA")
  );
}

function ehLinhaCabecalhoDiario(primeiraCelula: string): boolean {
  const t = primeiraCelula.trim().toUpperCase();
  return t === "DATA";
}

export function parseRelatorioDiario(rows: string[][]): LeadDiario[] {
  const out: LeadDiario[] = [];
  let header: string[] | null = null;
  let mapaOrigens: Map<number, string> = new Map();
  let idxVendas = -1;
  let idxFollowUp = -1;
  let idxTotalLeads = -1;

  for (const row of rows) {
    const primeira = (row[0] || "").trim();
    if (!primeira) continue;

    if (ehLinhaCabecalhoDiario(primeira)) {
      header = row;
      mapaOrigens = new Map();
      idxVendas = -1;
      idxFollowUp = -1;
      idxTotalLeads = -1;
      header.forEach((h, i) => {
        if (!h) return;
        const norm = h.trim().toUpperCase();
        if (norm === "DATA" || norm === "DIA SEMANA" || norm === "OBS" || norm === "ORIGEM DAS VENDAS") return;
        if (norm === "VENDAS") { idxVendas = i; return; }
        if (norm === "FOLLOW-UP" || norm === "FOLLOW UP") { idxFollowUp = i; return; }
        if (norm.includes("TOTAL LEADS")) { idxTotalLeads = i; return; }
        const origem = normalizarOrigem(h);
        if (ORIGENS_CONHECIDAS.has(origem)) mapaOrigens.set(i, origem);
      });
      continue;
    }

    if (ehLinhaTotal(primeira)) continue;
    if (!header) continue;

    const data = parseData(primeira);
    if (!data) continue;

    const porOrigem: Record<string, number> = {};
    let totalLeads = 0;
    for (const [i, origem] of mapaOrigens) {
      if (origem === "FOLLOW-UP") continue;
      const n = parseInt2(row[i] || "");
      if (n > 0) {
        porOrigem[origem] = (porOrigem[origem] || 0) + n;
        totalLeads += n;
      }
    }
    if (idxTotalLeads >= 0) {
      const n = parseInt2(row[idxTotalLeads] || "");
      if (n > 0) totalLeads = n;
    }
    const vendasContagem = idxVendas >= 0 ? parseInt2(row[idxVendas] || "") : 0;
    const followUpCount = idxFollowUp >= 0 ? parseInt2(row[idxFollowUp] || "") : 0;

    out.push({ data, porOrigem, totalLeads, followUpCount, vendasContagem });
  }
  return out;
}
