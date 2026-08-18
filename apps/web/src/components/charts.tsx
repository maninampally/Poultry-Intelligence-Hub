import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateShort, formatINRShort } from "@/lib/format";

const CHART_COLORS = [
  "hsl(142, 38%, 28%)", // leaf
  "hsl(30, 88%, 56%)",  // saffron
  "hsl(14, 68%, 48%)",  // terracotta
  "hsl(42, 78%, 48%)",  // turmeric
  "hsl(200, 40%, 38%)", // sky
  "hsl(28, 35%, 22%)",  // earth
  "hsl(0, 60%, 50%)",   // crimson
];

const tooltipStyle = {
  backgroundColor: "hsl(36, 38%, 98%)",
  border: "1px solid hsl(32, 22%, 84%)",
  borderRadius: "8px",
  fontSize: "12px",
  fontFamily: "inherit",
  padding: "8px 12px",
  boxShadow: "0 4px 8px rgba(28,25,14,0.08)",
};

export function MortalityBars({ data }: { data: { date: string | Date; value: number }[] }) {
  const formatted = data.map((d) => ({
    date: formatDateShort(d.date),
    value: d.value,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="hsl(32, 18%, 88%)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(30, 88%, 56%, 0.08)" }} />
        <Bar dataKey="value" fill="hsl(14, 68%, 48%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GrowthCurveChart({
  data,
}: {
  data: { day: number; actualWeight: number; standardWeight: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="hsl(32, 18%, 88%)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }}
          axisLine={false}
          tickLine={false}
          label={{ value: "Day", fontSize: 10, fill: "hsl(28, 12%, 42%)", position: "insideBottom", offset: -2 }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => `${Number(v).toFixed(2)} kg`}
        />
        <Legend iconType="line" wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        <Line type="monotone" dataKey="standardWeight" name="Cobb 500 standard" stroke="hsl(28, 12%, 60%)" strokeWidth={2} strokeDasharray="6 4" dot={false} />
        <Line type="monotone" dataKey="actualWeight" name="Your batch" stroke="hsl(142, 38%, 28%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(142, 38%, 28%)" }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FcrLine({ data }: { data: { date: string | Date; value: number }[] }) {
  const formatted = data.map((d) => ({ date: formatDateShort(d.date), value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="fcrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142, 38%, 28%)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(142, 38%, 28%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(32, 18%, 88%)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} domain={[1.4, "auto"]} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => Number(v).toFixed(2)} />
        <Area type="monotone" dataKey="value" stroke="hsl(142, 38%, 28%)" strokeWidth={2.5} fill="url(#fcrFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const categoryNames: Record<string, string> = {
  chick: "Day-old chicks",
  feed: "Feed",
  medicine: "Medicine & vaccine",
  labor: "Labor",
  utilities: "Utilities",
  equipment: "Equipment",
  misc: "Misc",
};

export function CostDonut({ data }: { data: { category: string; amount: number; pctOfTotal: number }[] }) {
  const formatted = data.map((d, i) => ({
    name: categoryNames[d.category] ?? d.category,
    value: d.amount,
    pct: d.pctOfTotal,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={92}
          paddingAngle={2}
        >
          {formatted.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, _n, p) => [`${formatINRShort(Number(v))} (${(p.payload as { pct: number }).pct.toFixed(1)}%)`, p.payload?.name as string]}
        />
        <Legend
          iconType="circle"
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CostHistoryArea({ data }: { data: { date: string | Date; value: number }[] }) {
  const formatted = data.map((d) => ({ date: formatDateShort(d.date), value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(30, 88%, 56%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(30, 88%, 56%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="hsl(32, 18%, 88%)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINRShort(v)} width={60} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINRShort(Number(v))} />
        <Area type="monotone" dataKey="value" stroke="hsl(30, 88%, 56%)" strokeWidth={2.5} fill="url(#costFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KpiTrendChart({ data }: { data: { date: string | Date; value: number }[] }) {
  const formatted = data.map((d) => ({ date: formatDateShort(d.date), value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={formatted} margin={{ top: 6, right: 0, bottom: 0, left: -22 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: "hsl(28, 12%, 42%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(14, 68%, 48%, 0.08)" }} />
        <Bar dataKey="value" fill="hsl(14, 68%, 48%)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
