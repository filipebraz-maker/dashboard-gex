import { lerAba } from "./sheets-client";
import { parseData, parseValor, parseInt2, parseIntSigned } from "./gex-parsers";
import type { PostAtracao, CrescimentoDia } from "./atracao-types";

const ABA_CONTEUDO = "CONTEÚDO DE ATRAÇÃO";
const ABA_GEX = "[GEX] Crescimento do instagram diário";
const ABA_WAGNER = "[WAGNER] Crescimento do instagram diário";

function spreadsheetId(): string {
  const id = process.env.GEX_ATRACAO_SHEET_ID;
  if (!id) throw new Error("GEX_ATRACAO_SHEET_ID não definido");
  return id;
}

function parsePct(raw: string): number {
  if (!raw) return 0;
  const v = raw.replace("%", "").replace(",", ".").trim();
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export async function carregarPostsAtracao(): Promise<PostAtracao[]> {
  const rows = await lerAba(spreadsheetId(), ABA_CONTEUDO);
  // Header na linha 5 (index 5), dados a partir da linha 6 (algumas linhas de cabeçalho/aviso)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if ((rows[i] || []).some((c) => (c || "").toUpperCase().includes("ID")) &&
        (rows[i] || []).some((c) => (c || "").toUpperCase().includes("DATA"))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];
  const out: PostAtracao[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const id = (r[0] || "").trim();
    if (!id || id.toUpperCase().startsWith("ATEN")) continue;
    const data = parseData(r[1] || "");
    out.push({
      id,
      data,
      link: (r[2] || "").trim(),
      perfil: (r[3] || "").trim(),
      linhaEditorial: (r[4] || "").trim(),
      observacao: (r[5] || "").trim(),
      seguidoresAntes: parseInt2(r[6] || ""),
      visitaPerfil: parseInt2(r[7] || ""),
      seguidoresApos: parseInt2(r[8] || ""),
      taxaConversao: parsePct(r[9] || ""),
      valorGasto: parseValor(r[10] || ""),
      custoPorSeguidor: parseValor(r[11] || ""),
      status: (r[12] || "").trim(),
      formato: (r[13] || "").trim(),
      fase: (r[14] || "").trim(),
      preNomeAnuncio: (r[15] || "").trim(),
      publico: (r[17] || "").trim(),
    });
  }
  return out;
}

async function carregarCrescimentoAba(aba: string): Promise<CrescimentoDia[]> {
  const rows = await lerAba(spreadsheetId(), aba);
  const out: CrescimentoDia[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] || [];
    const data = parseData(r[0] || "");
    if (!data) continue;
    out.push({
      data,
      inicio: parseInt2(r[1] || ""),
      fim: parseInt2(r[2] || ""),
      diferenca: parseIntSigned(r[3] || ""),
    });
  }
  return out;
}

export async function carregarCrescimentoGex(): Promise<CrescimentoDia[]> {
  return carregarCrescimentoAba(ABA_GEX);
}

export async function carregarCrescimentoWagner(): Promise<CrescimentoDia[]> {
  return carregarCrescimentoAba(ABA_WAGNER);
}
