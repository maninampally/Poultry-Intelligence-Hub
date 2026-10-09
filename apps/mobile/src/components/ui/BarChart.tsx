import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { colors } from "@/theme/tokens";

interface BarChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
}

/** Simple bar chart for Feed / Water consumption (Feed & Water, Reports). */
export function BarChart({
  data,
  labels,
  height = 150,
  color = colors.brand,
}: BarChartProps) {
  const width = 300;
  const padX = 6;
  const padY = 8;
  const max = Math.max(...data) || 1;
  const gap = 6;
  const barW = (width - padX * 2 - gap * (data.length - 1)) / data.length;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((v, i) => {
          const h = (v / max) * (height - padY * 2);
          const x = padX + i * (barW + gap);
          const y = height - padY - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={color}
              opacity={i === data.length - 1 ? 1 : 0.55}
            />
          );
        })}
      </Svg>
      {labels ? (
        <View className="mt-1 flex-row justify-between px-1.5">
          {labels.map((l, i) => (
            <Text key={i} className="text-[10px] text-ink-faint">
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
