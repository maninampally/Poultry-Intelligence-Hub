import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { demoFarm } from "@/data/demo";

const menu: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
}[] = [
  { key: "finance", label: "Finance / Batch Comparison", icon: "cash-outline", href: "/more/finance" },
  { key: "history", label: "Historical Batches", icon: "time-outline", href: "/more/history" },
  { key: "ai", label: "AI Assistant", icon: "sparkles-outline", href: "/more/ai" },
  { key: "cloud", label: "Cloud & Security", icon: "cloud-outline", href: "/more/cloud" },
  { key: "users", label: "Users & Access", icon: "people-outline" },
  { key: "settings", label: "Settings", icon: "settings-outline" },
  { key: "help", label: "Help & Support", icon: "help-circle-outline" },
];

/** More tab — Farmer Profile & Farm Setup + secondary navigation. */
export default function MoreTab() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-ink">My Farm</Text>
        <Text className="text-sm text-ink-muted">Manage your farm details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Profile */}
        <Card>
          <View className="flex-row items-center">
            <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <Ionicons name="person" size={26} color={colors.brand} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">
                {demoFarm.ownerName}
              </Text>
              <Text className="text-xs text-ink-muted">{demoFarm.ownerRole}</Text>
            </View>
            <Pressable hitSlop={8}>
              <Ionicons name="create-outline" size={20} color={colors.inkMuted} />
            </Pressable>
          </View>
        </Card>

        {/* Farm details */}
        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">Farm Details</Text>
          <Detail label="Farm Name" value={demoFarm.name} />
          <Detail label="Location" value={demoFarm.location} />
          <Detail label="Total Sheds" value={`${demoFarm.totalSheds}`} />
          <Detail
            label="Total Capacity"
            value={`${demoFarm.totalCapacity.toLocaleString("en-IN")} birds`}
            last
          />
        </Card>

        {/* Menu */}
        <Card padded={false}>
          {menu.map((m, i) => (
            <Pressable
              key={m.key}
              onPress={() => m.href && router.push(m.href as never)}
              className={`flex-row items-center px-4 py-3.5 active:bg-brand-50 ${
                i < menu.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Ionicons name={m.icon} size={20} color={colors.brand} />
              <Text className="ml-3 flex-1 text-sm font-medium text-ink">
                {m.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </Pressable>
          ))}
        </Card>

        <Pressable
          onPress={() => router.replace("/login")}
          className="mt-2 items-center py-3"
        >
          <Text className="text-sm font-semibold text-danger">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={`flex-row justify-between py-2.5 ${last ? "" : "border-b border-border"}`}
    >
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{value}</Text>
    </View>
  );
}
