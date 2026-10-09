import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  onDark?: boolean;
}

/**
 * Poultry Intelligence brand mark.
 * (Mockups show the legacy "Murgi Mitra" wordmark; per the product-direction
 * docs the product is renamed to Poultry Intelligence, used here.)
 */
export function Logo({ size = "md", showTagline = false, onDark = false }: LogoProps) {
  const iconSize = size === "lg" ? 34 : size === "md" ? 24 : 20;
  const titleClass =
    size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-base";
  const titleColor = onDark ? "text-white" : "text-ink";
  return (
    <View className="flex-row items-center">
      <View
        className="mr-2 items-center justify-center rounded-xl"
        style={{
          width: iconSize + 12,
          height: iconSize + 12,
          backgroundColor: onDark ? "rgba(255,255,255,0.15)" : colors.brandSoft,
        }}
      >
        <Ionicons
          name="egg"
          size={iconSize}
          color={onDark ? "#fff" : colors.brand}
        />
      </View>
      <View>
        <Text className={`font-bold ${titleClass} ${titleColor}`}>
          Poultry Intelligence
        </Text>
        {showTagline ? (
          <Text
            className={`text-xs ${onDark ? "text-white/80" : "text-ink-muted"}`}
          >
            Healthy Birds. Better Farms.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
