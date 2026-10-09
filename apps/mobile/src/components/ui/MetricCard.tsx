import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { StatusTone, colors, toneStyles } from "@/theme/tokens";
import { Card } from "./Card";

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconTone?: StatusTone;
  label: string;
  value: string;
  /** Contextual sub-line, e.g. "vs 1,150 kg yesterday" or "0.25%". */
  context?: string;
  /** Status pill text shown at bottom-right, e.g. "Normal". */
  statusLabel?: string;
  statusTone?: StatusTone;
}

/**
 * Metric card used in the Home "Today" grid and elsewhere.
 * Follows the mockups' "intelligence, not just statistics" principle:
 * a value always paired with context and/or a status pill.
 */
export function MetricCard({
  icon,
  iconTone = "neutral",
  label,
  value,
  context,
  statusLabel,
  statusTone = "ok",
}: MetricCardProps) {
  const iconStyle = toneStyles[iconTone];
  const statusStyle = statusTone ? toneStyles[statusTone] : null;
  return (
    <Card className="flex-1">
      <View className="flex-row items-start justify-between">
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: iconStyle.bg }}
        >
          <Ionicons name={icon} size={18} color={iconStyle.dot} />
        </View>
        {statusLabel ? (
          <View
            className="flex-row items-center rounded-pill px-2 py-0.5"
            style={{ backgroundColor: statusStyle?.bg }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: statusStyle?.text }}
            >
              {statusLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-3 text-xs font-medium text-ink-muted">{label}</Text>
      <Text className="mt-0.5 text-xl font-bold text-ink">{value}</Text>
      {context ? (
        <Text className="mt-0.5 text-[11px] text-ink-faint" style={{ color: colors.inkFaint }}>
          {context}
        </Text>
      ) : null}
    </Card>
  );
}
