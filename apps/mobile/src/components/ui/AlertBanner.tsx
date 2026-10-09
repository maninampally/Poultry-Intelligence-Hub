import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { StatusTone, toneStyles } from "@/theme/tokens";

interface AlertBannerProps {
  title: string;
  message: string;
  tone?: StatusTone;
}

/** "Needs Attention" banner on Home and alert rows elsewhere. */
export function AlertBanner({
  title,
  message,
  tone = "warning",
}: AlertBannerProps) {
  const s = toneStyles[tone];
  const icon =
    tone === "critical"
      ? "alert-circle"
      : tone === "ok"
        ? "checkmark-circle"
        : "warning";
  return (
    <View
      className="flex-row items-start rounded-2xl p-3"
      style={{ backgroundColor: s.bg }}
    >
      <Ionicons name={icon} size={18} color={s.dot} style={{ marginTop: 1 }} />
      <View className="ml-2.5 flex-1">
        <Text className="text-sm font-semibold" style={{ color: s.text }}>
          {title}
        </Text>
        <Text className="mt-0.5 text-xs leading-4" style={{ color: s.text }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
