import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardTypeOptions,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@/theme/tokens";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}

/** Labeled text input. Supports password show/hide (Login) and a left icon (mobile field). */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  leftIcon,
  autoCapitalize = "none",
  multiline = false,
}: InputProps) {
  const [hidden, setHidden] = useState(secure);
  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-2 text-sm font-medium text-ink-muted">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-2xl border border-border bg-surface px-4 ${
          multiline ? "py-3" : "h-14"
        }`}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={colors.inkFaint}
            style={{ marginRight: 8 }}
          />
        ) : null}
        <TextInput
          className="flex-1 text-base text-ink"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.inkFaint}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
