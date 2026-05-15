"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { formatBRL, formatNumber } from "@/lib/utils";

type Format = "currency" | "number";

interface BarChartWrapperProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: Array<{ key: string; color: string; name: string }>;
  height?: number;
  layout?: "horizontal" | "vertical";
  format?: Format;
  colors?: string[];
}

function getFormatter(format: Format | undefined) {
  if (format === "currency") return (v: number) => formatBRL(v);
  if (format === "number") return (v: number) => formatNumber(v);
  return undefined;
}

export function BarChartWrapper({
  data,
  xKey,
  bars,
  height = 280,
  layout = "horizontal",
  format,
  colors,
}: BarChartWrapperProps) {
  const isHorizontal = layout === "horizontal";
  const formatter = getFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={!isHorizontal} horizontal={isHorizontal} />
        {isHorizontal ? (
          <>
            <XAxis dataKey={xKey} fontSize={11} tickLine={false} axisLine={false} dy={8} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={formatter} />
          </>
        ) : (
          <>
            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatter} />
            <YAxis dataKey={xKey} type="category" fontSize={11} tickLine={false} axisLine={false} width={140} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#181E2D",
            border: "1px solid #1F2937",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#94A3B8", marginBottom: 4 }}
          formatter={formatter ? (value: unknown) => formatter(Number(value)) : undefined}
        />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} iconType="circle" iconSize={8} />}
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} radius={[4, 4, 0, 0]} maxBarSize={48}>
            {colors && data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
