"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatBRL, formatNumber } from "@/lib/utils";

type Format = "currency" | "number" | "roas";

interface LineChartWrapperProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  lines: Array<{ key: string; color: string; name: string }>;
  height?: number;
  format?: Format;
}

function getFormatter(format: Format | undefined) {
  if (format === "currency") return (v: number) => formatBRL(v);
  if (format === "number") return (v: number) => formatNumber(v);
  if (format === "roas") return (v: number) => `${v.toFixed(2)}x`;
  return undefined;
}

export function LineChartWrapper({ data, xKey, lines, height = 280, format }: LineChartWrapperProps) {
  const formatter = getFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} fontSize={11} tickLine={false} axisLine={false} dy={8} />
        <YAxis
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dx={-4}
          tickFormatter={formatter}
        />
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
        {lines.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} iconType="circle" iconSize={8} />
        )}
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3, fill: line.color }}
            activeDot={{ r: 5 }}
            name={line.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
