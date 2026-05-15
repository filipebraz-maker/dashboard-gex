export interface PostAtracao {
  id: string;
  data: Date | null;
  link: string;
  perfil: string;
  linhaEditorial: string;
  observacao: string;
  seguidoresAntes: number;
  visitaPerfil: number;
  seguidoresApos: number;
  taxaConversao: number;
  valorGasto: number;
  custoPorSeguidor: number;
  status: string;
  formato: string;
  fase: string;
  preNomeAnuncio: string;
  publico: string;
}

export interface CrescimentoDia {
  data: Date;
  inicio: number;
  fim: number;
  diferenca: number;
}
