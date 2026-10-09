import { Pressable, Text, View } from "react-native";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  /** "pill" = rounded filled toggle (Feed/Water). "underline" = tabs (Overview/Growth). */
  variant?: "pill" | "underline";
}

/** Toggle / tab control used for Feed·Water, Health·Mortality, Overview·Growth·Records, and 7D·30D·… */
export function SegmentedControl({
  options,
  value,
  onChange,
  variant = "pill",
}: SegmentedControlProps) {
  if (variant === "underline") {
    return (
      <View className="flex-row border-b border-border">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className="mr-6 pb-2.5"
            >
              <Text
                className={`text-sm ${
                  active ? "font-bold text-brand-700" : "font-medium text-ink-muted"
                }`}
              >
                {opt}
              </Text>
              {active ? (
                <View className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-brand" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View className="flex-row rounded-2xl bg-brand-50 p-1">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            className={`flex-1 items-center rounded-xl py-2 ${
              active ? "bg-brand" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-brand-700"
              }`}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
