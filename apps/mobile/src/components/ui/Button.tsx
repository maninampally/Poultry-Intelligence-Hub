import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-brand", text: "text-white" },
  secondary: { container: "bg-brand-50 border border-brand-100", text: "text-brand-700" },
  ghost: { container: "bg-transparent", text: "text-brand-700" },
};

/** Primary action button used across forms and screens (see Login "Login", Daily Record "Save"). */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`h-14 flex-row items-center justify-center rounded-2xl px-5 ${v.container} ${
        fullWidth ? "w-full" : ""
      } ${isDisabled ? "opacity-60" : "active:opacity-90"}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#2e7d52"} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`text-base font-semibold ${v.text}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
