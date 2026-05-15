import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Credenciais Google Sheets ausentes");
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function lerAba(spreadsheetId: string, aba: string, range = "A:CZ"): Promise<string[][]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const titulos = await listarAbas(spreadsheetId);
  const alvo = aba.normalize("NFC");
  const tituloReal = titulos.find((t) => t.normalize("NFC") === alvo);
  if (!tituloReal) {
    throw new Error(`Aba "${aba}" não encontrada. Abas disponíveis: ${titulos.join(", ")}`);
  }
  const quotado = tituloReal.replace(/'/g, "''");
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${quotado}'!${range}`,
  });
  return (res.data.values as string[][]) || [];
}

export async function listarAbas(spreadsheetId: string): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return (res.data.sheets || []).map((s) => s.properties?.title || "").filter(Boolean);
}

export function linhasParaObjetos<T = Record<string, string>>(rows: string[][]): T[] {
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj as T;
  });
}
