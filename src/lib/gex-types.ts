export type Area = "FISCAL" | "ADMINISTRATIVO" | "CONTROLE";
export type ProdutoBase = "ANUAL" | "SEMESTRAL" | "TRIMESTRAL" | "RECORRENTE" | "OUTRO";

export interface Venda {
  dataInicio: Date | null;
  dataVenda: Date;
  aluno: string;
  produto: string;
  produtoBase: ProdutoBase;
  area: Area | null;
  tipos: string[];
  origem: string;
  valor: number;
  tempo: number | null;
  obs: string;
  cancelada: boolean;
  mes: string;
}

export interface LeadDiario {
  data: Date;
  porOrigem: Record<string, number>;
  totalLeads: number;
  followUpCount: number;
  vendasContagem: number;
}
