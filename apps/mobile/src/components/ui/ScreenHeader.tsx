import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  showBack?: boolean;
}

/** Back-arrow header used on secondary screens (Flock Details, Daily Record, etc.). */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  showBack = true,
}: ScreenHeaderProps) {
  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : null));
  return (
    <View className="flex-row items-center border-b border-border bg-surface px-4 py-3">
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleBack}
          hitSlop={8}
          className="mr-2 h-9 w-9 items-center justify-center rounded-full active:bg-brand-50"
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text className="text-base font-bold text-ink">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-ink-muted">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
