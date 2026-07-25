"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface ChartDay {
  day: string;
  completed: number;
}

export function ProgressChart({ data }: { data: ChartDay[] }) {
  const todayIndex = data.length - 1;

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} quests`, "Completed"]}
          />
          <Bar dataKey="completed" radius={[8, 8, 8, 8]} maxBarSize={34}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === todayIndex ? "hsl(var(--accent))" : "hsl(var(--primary))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
