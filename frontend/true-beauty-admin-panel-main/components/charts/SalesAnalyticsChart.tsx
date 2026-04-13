"use client";

import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

type SalesPoint = {
  label: string;
  value: number;
  productName?: string;
};

type SalesAnalyticsChartProps = {
  data: SalesPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  currency?: string;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

type SalesTooltipProps = TooltipProps<number, string> & {
  currency: string;
};

function SalesTooltip({ active, payload, label, currency }: SalesTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload as SalesPoint | undefined;
  const displayName = point?.productName ?? label;
  const rawValue = typeof point?.value === "number" ? point.value : 0;

  return (
    <div className="rounded-xl border border-pink-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10">
      <p className="text-xs font-medium text-gray-500">
        {displayName}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(rawValue, currency)}
      </p>
    </div>
  );
}

export function SalesAnalyticsChart({
  data,
  xAxisLabel = "Time",
  yAxisLabel = "Sales",
  currency = "INR",
}: SalesAnalyticsChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!data?.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value));

  if (!mounted) {
    return (
      <div
        className="w-full h-56 sm:h-64 md:h-72 min-h-[14rem] flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100"
        aria-hidden
      >
        <span className="text-sm text-gray-400">Loading chart…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-56 sm:h-64 md:h-72 min-h-[14rem]" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 16, left: 4, bottom: 40 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#ec4899" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value: number) =>
              `${Math.round(value / 1000)}k`
            }
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />

          <Tooltip
            cursor={{ stroke: "#f9a8d4", strokeWidth: 1 }}
            content={(props: TooltipProps<number, string>) => (
              <SalesTooltip {...props} currency={currency} />
            )}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#ec4899"
            strokeWidth={3}
            fill="url(#salesGradient)"
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: "#fb7185",
              fill: "#fff",
            }}
            dot={({
              cx,
              cy,
              payload,
              index,
            }: {
              cx?: number;
              cy?: number;
              payload?: SalesPoint;
              index?: number;
            }) => {
              const isPeak = payload?.value === maxValue;

              if (!cx || !cy) {
                return <g key={index} />;
              }

              return (
                <g key={payload?.label ?? index ?? cx}>
                  {isPeak && (
                    <>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill="rgba(248, 113, 113, 0.18)"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#fb7185"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </>
                  )}
                  {!isPeak && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#ec4899"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  )}
                </g>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {(xAxisLabel || yAxisLabel) && (
        <div className="mt-2 flex items-center justify-between text-[11px] sm:text-xs text-gray-400 px-0.5">
          <span className="truncate">{xAxisLabel}</span>
          <span className="truncate text-right">{yAxisLabel}</span>
        </div>
      )}
    </div>
  );
}

