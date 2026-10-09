import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertBanner,
  Badge,
  Card,
  Logo,
  MetricCard,
  ProgressBar,
} from "@/components/ui";
import { StatusTone, colors } from "@/theme/tokens";
import { activeFlock, demoFarm } from "@/data/demo";

const quickActions: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatusTone;
  href?: string;
}[] = [
  { key: "daily", label: "Daily Record", icon: "clipboard-outline", tone: "ok", href: "/daily-record" },
  { key: "mortality", label: "Mortality", icon: "alert-circle-outline", tone: "critical" },
  { key: "feed", label: "Feed", icon: "nutrition-outline", tone: "warning" },
  { key: "medicine", label: "Medicine", icon: "medkit-outline", tone: "info" },
];

/** B.2 Home / Dashboard — "Summary of what matters today". */
export default function HomeScreen() {
  const f = activeFlock;
  const progress = Math.round((f.ageDays / f.cycleLengthDays) * 100);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <Logo size="sm" />
        <View className="flex-row items-center gap-3">
          <Pressable hitSlop={8} className="relative">
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
            <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
          </Pressable>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-100">
            <Ionicons name="person" size={16} color={colors.brand} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View>
          <Text className="text-xl font-bold text-ink">
            Good morning, {demoFarm.ownerName.split(" ")[0]}
          </Text>
          <Text className="mt-0.5 text-sm text-ink-muted">
            Here&apos;s how your farm is doing today.
          </Text>
        </View>

        {/* Active flock card */}
        <Card onPress={() => router.push(`/flock/${f.id}`)}>
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Ionicons name="egg" size={22} color={colors.brand} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{f.name}</Text>
              <Text className="text-xs text-ink-muted">
                Day {f.ageDays} · {f.currentBirds.toLocaleString("en-IN")} birds
              </Text>
            </View>
            <Badge label="Healthy" tone="ok" dot />
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </View>
          <View className="mt-4">
            <ProgressBar percent={progress} />
            <Text className="mt-1.5 text-right text-[11px] text-ink-faint">
              {progress}% completed
            </Text>
          </View>
        </Card>

        {/* Today grid */}
        <View>
          <Text className="mb-3 text-sm font-bold text-ink">Today</Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <MetricCard
                icon="nutrition"
                iconTone="warning"
                label="Feed"
                value="1,240 kg"
                statusLabel="Normal"
                statusTone="ok"
              />
              <MetricCard
                icon="water"
                iconTone="info"
                label="Water"
                value="3,420 L"
                statusLabel="Normal"
                statusTone="ok"
              />
            </View>
            <View className="flex-row gap-3">
              <MetricCard
                icon="alert-circle"
                iconTone="critical"
                label="Birds dead"
                value="12"
                context="0.25%"
              />
              <MetricCard
                icon="scale"
                iconTone="ok"
                label="Cost / bird"
                value={`₹${f.metrics.costPerBird.toFixed(2)}`}
                context="Avg. weight 2.18 kg"
              />
            </View>
          </View>
        </View>

        {/* Needs attention */}
        <AlertBanner
          title="Needs Attention"
          message="Feed consumption is 8% higher than yesterday (1,240 kg vs 1,150 kg)."
          tone="warning"
        />

        {/* Quick actions */}
        <View>
          <Text className="mb-3 text-sm font-bold text-ink">Quick Actions</Text>
          <View className="flex-row gap-3">
            {quickActions.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => a.href && router.push(a.href as never)}
                className="flex-1 items-center rounded-2xl border border-border bg-surface py-3 active:opacity-80"
              >
                <Ionicons name={a.icon} size={22} color={colors.brand} />
                <Text className="mt-1.5 text-center text-[11px] font-medium text-ink">
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
