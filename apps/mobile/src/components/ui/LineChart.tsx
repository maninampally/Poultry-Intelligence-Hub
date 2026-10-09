import { View } from "react-native";
import Svg, { Circle, Path, Line as SvgLine } from "react-native-svg";
import { colors } from "@/theme/tokens";

interface Series {
  data: number[];
  color?: string;
  dashed?: boolean;
}

interface LineChartProps {
  series: Series[];
  height?: number;
  /** Optional shared y-range across series; auto-computed if omitted. */
  minY?: number;
  maxY?: number;
  showDots?: boolean;
}

/**
 * Lightweight multi-series line chart (Weight Trend, FCR Trend, Weight vs Target).
 * Pure SVG, no external chart dependency — keeps the bundle small for low-end phones.
 */
export function LineChart({
  series,
  height = 160,
  minY,
  maxY,
  showDots = true,
}: LineChartProps) {
  const width = 300; // viewBox width; scales responsively via preserveAspectRatio
  const padX = 8;
  const padY = 12;
  const allValues = series.flatMap((s) => s.data);
  const lo = minY ?? Math.min(...allValues);
  const hi = maxY ?? Math.max(...allValues);
  const range = hi - lo || 1;

  const pointCount = Math.max(...series.map((s) => s.data.length));
  const stepX = (width - padX * 2) / Math.max(pointCount - 1, 1);

  const toXY = (value: number, i: number) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (value - lo) / range) * (height - padY * 2);
    return { x, y };
  };

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* horizontal gridlines */}
        {[0, 0.5, 1].map((t) => (
          <SvgLine
            key={t}
            x1={padX}
            x2={width - padX}
            y1={padY + t * (height - padY * 2)}
            y2={padY + t * (height - padY * 2)}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {series.map((s, si) => {
          const color = s.color ?? colors.brand;
          const path = s.data
            .map((v, i) => {
              const { x, y } = toXY(v, i);
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <Path
              key={si}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "5,4" : undefined}
            />
          );
        })}
        {showDots &&
          series.map((s, si) =>
            s.data.map((v, i) => {
              const { x, y } = toXY(v, i);
              return (
                <Circle
                  key={`${si}-${i}`}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={s.color ?? colors.brand}
                />
              );
            }),
          )}
      </Svg>
    </View>
  );
}
