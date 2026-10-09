import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui";
import { StatusTone, colors, toneStyles } from "@/theme/tokens";
import { recentActivity } from "@/data/demo";

const actions: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatusTone;
  href: string;
}[] = [
  { key: "feed", label: "Feed & Water", icon: "nutrition", tone: "warning", href: "/records/feed-water" },
  { key: "health", label: "Health & Mortality", icon: "pulse", tone: "critical", href: "/records/health" },
  { key: "medicine", label: "Medicine & Vaccination", icon: "medkit", tone: "info", href: "/records/medicine" },
  { key: "daily", label: "Add Daily Record", icon: "clipboard", tone: "ok", href: "/daily-record" },
];

/** Records tab — "Add & Manage" hub for daily operations. */
export default function RecordsTab() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-ink">Quick Actions</Text>
        <Text className="text-sm text-ink-muted">
          Quick actions for daily operations
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row flex-wrap gap-3">
          {actions.map((a) => {
            const s = toneStyles[a.tone];
            return (
              <Pressable
                key={a.key}
                onPress={() => router.push(a.href as never)}
                className="w-[47%] rounded-card border border-border bg-surface p-4 active:opacity-85"
                style={{ flexGrow: 1 }}
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: s.bg }}
                >
                  <Ionicons name={a.icon} size={22} color={s.dot} />
                </View>
                <Text className="mt-3 text-sm font-semibold text-ink">
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">Recent Records</Text>
          <View className="gap-3">
            {recentActivity.map((r) => (
              <View key={r.id} className="flex-row items-center">
                <Ionicons
                  name={
                    r.kind === "feed"
                      ? "nutrition"
                      : r.kind === "water"
                        ? "water"
                        : "alert-circle"
                  }
                  size={18}
                  color={colors.brand}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-medium text-ink">{r.label}</Text>
                  <Text className="text-xs text-ink-muted">{r.value}</Text>
                </View>
                <Text className="text-[11px] text-ink-faint">{r.timestamp}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
