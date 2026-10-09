import { Pressable, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
}

/** White rounded surface with subtle border used for all content blocks in the mockups. */
export function Card({
  children,
  onPress,
  padded = true,
  className = "",
  ...rest
}: CardProps) {
  const base = `rounded-card border border-border bg-surface ${
    padded ? "p-4" : ""
  } ${className}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-90`}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
