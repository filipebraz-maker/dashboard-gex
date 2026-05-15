"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import clsx from "clsx";

export type SortDir = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right";
  sortable?: boolean;
  /** Valor pra ordenação (string compara alfabeticamente, number numericamente) */
  accessor?: (row: T) => string | number | null | undefined;
  /** Conteúdo a renderizar na célula */
  render: (row: T) => React.ReactNode;
  /** Classes extras na célula */
  cellClassName?: string;
  /** Classes extras no header */
  headerClassName?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  defaultSort?: string;
  defaultSortDir?: SortDir;
  emptyMessage?: string;
  footer?: React.ReactNode;
  rowKey: (row: T, i: number) => string | number;
  rowClassName?: (row: T, i: number) => string | undefined;
  rowStyle?: (row: T, i: number) => React.CSSProperties | undefined;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function SortableTable<T>({
  columns,
  data,
  defaultSort,
  defaultSortDir = "desc",
  emptyMessage = "Sem dados",
  footer,
  rowKey,
  rowClassName,
  rowStyle,
  onRowClick,
  className,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.accessor) return data;
    const acc = col.accessor;
    return [...data].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      // null/undefined sempre por último
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  return (
    <table className={clsx("dt", className)}>
      <thead>
        <tr>
          {columns.map((col) => {
            const sortable = col.sortable !== false && !!col.accessor;
            const active = sortable && sortKey === col.key;
            const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
            return (
              <th
                key={col.key}
                className={clsx(
                  col.align === "right" && "text-right",
                  sortable && "cursor-pointer select-none",
                  col.headerClassName
                )}
                onClick={sortable ? () => toggleSort(col.key) : undefined}
                style={{ color: active ? "var(--text)" : undefined }}
              >
                <span
                  className={clsx(
                    "inline-flex items-center gap-1",
                    col.align === "right" && "justify-end w-full"
                  )}
                >
                  {col.header}
                  {sortable && (
                    <Icon
                      className="w-3 h-3 shrink-0"
                      style={{ color: active ? "var(--cyan)" : "var(--text-muted)" }}
                    />
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr
            key={rowKey(row, i)}
            className={clsx(rowClassName?.(row, i), onRowClick && "cursor-pointer transition-colors")}
            style={rowStyle?.(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={clsx(col.align === "right" && "text-right", col.cellClassName)}
              >
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
        {sorted.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="text-center text-xs py-4"
              style={{ color: "var(--text-dim)" }}
            >
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
      {footer && <tfoot>{footer}</tfoot>}
    </table>
  );
}
