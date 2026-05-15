"use client";

import { useState, useMemo } from "react";
import { Search, RotateCw } from "lucide-react";
import { SortableTable, type Column } from "@/components/SortableTable";
import { Pill } from "@/components/Pill";
import { formatBRL } from "@/lib/utils";

export interface VendaRow {
  dataVendaISO: string;
  dataVendaBR: string;
  aluno: string;
  produtoBase: string;
  area: string;
  tipos: string[];
  origem: string;
  valor: number;
  tempo: number | null;
  cancelada: boolean;
  recorrente: boolean;
  qtdComprasAluno: number;
}

interface Props {
  vendas: VendaRow[];
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function VendasTable({ vendas }: Props) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = normalizar(busca);
    if (!q) return vendas;
    return vendas.filter((v) => normalizar(v.aluno).includes(q));
  }, [vendas, busca]);

  const columns: Column<VendaRow>[] = [
    {
      key: "data",
      header: "Data",
      accessor: (v) => v.dataVendaISO,
      render: (v) => <span className="mono">{v.dataVendaBR}</span>,
    },
    {
      key: "aluno",
      header: "Aluno",
      accessor: (v) => v.aluno,
      render: (v) => (
        <div className="flex items-center gap-2">
          <span>{v.aluno}</span>
          {v.recorrente && (
            <Pill tone="cyan" className="text-[10px]">
              <RotateCw className="w-3 h-3" />
              {v.qtdComprasAluno}x
            </Pill>
          )}
        </div>
      ),
    },
    {
      key: "produto",
      header: "Produto",
      accessor: (v) => v.produtoBase,
      render: (v) => <span className="mono" style={{ color: "var(--text-dim)" }}>{v.produtoBase}</span>,
    },
    {
      key: "area",
      header: "Área",
      accessor: (v) => v.area,
      render: (v) => <span className="mono" style={{ color: "var(--text-dim)" }}>{v.area || "—"}</span>,
    },
    {
      key: "tipo",
      header: "Tipo",
      accessor: (v) => (v.cancelada ? "ZZZ_CANCELADA" : v.tipos[0] || ""),
      render: (v) =>
        v.cancelada ? (
          <Pill tone="red">Cancelada</Pill>
        ) : (
          <span className="mono" style={{ color: "var(--text-dim)" }}>{v.tipos[0] || "—"}</span>
        ),
    },
    {
      key: "origem",
      header: "Origem",
      accessor: (v) => v.origem,
      render: (v) => <span className="mono" style={{ color: "var(--text-dim)" }}>{v.origem || "—"}</span>,
    },
    {
      key: "valor",
      header: "Valor",
      align: "right",
      accessor: (v) => v.valor,
      render: (v) => (
        <span className="num" style={{ color: v.cancelada ? "var(--text-muted)" : "var(--text)" }}>
          {formatBRL(v.valor)}
        </span>
      ),
    },
    {
      key: "tempo",
      header: "Tempo",
      align: "right",
      accessor: (v) => v.tempo ?? 9999,
      render: (v) => (
        <span className="num" style={{ color: "var(--text-dim)" }}>
          {v.tempo !== null ? `${v.tempo}d` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 max-w-md">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
          style={{ background: "var(--bg-elev)", border: "1px solid var(--border)" }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-dim)" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno..."
            className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-[var(--text-muted)]"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              ×
            </button>
          )}
        </div>
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
          {filtradas.length} de {vendas.length}
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 md:-mx-5">
        <div className="min-w-[900px] px-4 md:px-5">
          <SortableTable
            columns={columns}
            data={filtradas}
            defaultSort="data"
            defaultSortDir="desc"
            rowKey={(v, i) => `${v.aluno}-${v.dataVendaISO}-${i}`}
            emptyMessage={busca ? "Nenhum aluno encontrado" : "Sem vendas no período"}
          />
        </div>
      </div>
    </div>
  );
}
