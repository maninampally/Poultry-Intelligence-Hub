import { Text, View } from "react-native";
import { StatusTone, toneStyles } from "@/theme/tokens";

interface BadgeProps {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
}

/** Small status pill: "Healthy", "Normal", "Active", "Ongoing", "0.25%", etc. */
export function Badge({ label, tone = "neutral", dot = false }: BadgeProps) {
  const s = toneStyles[tone];
  return (
    <View
      className="flex-row items-center self-start rounded-pill px-2.5 py-1"
      style={{ backgroundColor: s.bg }}
    >
      {dot ? (
        <View
          className="mr-1.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: s.dot }}
        />
      ) : null}
      <Text className="text-xs font-semibold" style={{ color: s.text }}>
        {label}
      </Text>
    </View>
  );
}
