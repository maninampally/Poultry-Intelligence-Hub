import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  Card,
  LineChart,
  ScreenHeader,
  SegmentedControl,
} from "@/components/ui";
import { StatusTone, colors } from "@/theme/tokens";
import { activeFlock, recentActivity, weightTrend } from "@/data/demo";
import { ActivityItem } from "@/data/models";

const TABS = ["Overview", "Growth", "Records"];

const activityIcon: Record<ActivityItem["kind"], { icon: keyof typeof Ionicons.glyphMap; tone: StatusTone }> = {
  feed: { icon: "nutrition", tone: "warning" },
  water: { icon: "water", tone: "info" },
  mortality: { icon: "alert-circle", tone: "critical" },
  weight: { icon: "scale", tone: "ok" },
  medicine: { icon: "medkit", tone: "info" },
  vaccination: { icon: "shield-checkmark", tone: "ok" },
};

/** B.3 Flock Details — "Track performance of each batch". */
export default function FlockDetailsScreen() {
  const [tab, setTab] = useState("Overview");
  const f = activeFlock;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader
        title={f.name}
        subtitle={`Day ${f.ageDays} · ${f.breed}`}
        right={<Badge label="Healthy" tone="ok" dot />}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Top stat strip */}
        <Card>
          <View className="flex-row">
            <Stat label="Current birds" value={f.currentBirds.toLocaleString("en-IN")} sub={`Started ${f.initialBirds.toLocaleString("en-IN")}`} />
            <Divider />
            <Stat label="Mortality" value={`${f.metrics.mortalityCount}`} sub={`${f.metrics.mortalityPct}%`} />
            <Divider />
            <Stat label="Avg weight" value={`${f.metrics.avgWeightKg} kg`} sub="per bird" />
            <Divider />
            <Stat label="FCR" value={`${f.metrics.fcr}`} sub="avg." />
          </View>
        </Card>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-ink-muted">Expected market date</Text>
          <Text className="text-sm font-semibold text-ink">Dec 10, 2025</Text>
        </View>

        <SegmentedControl
          options={TABS}
          value={tab}
          onChange={setTab}
          variant="underline"
        />

        {tab === "Overview" ? <Overview /> : null}
        {tab === "Growth" ? <Growth /> : null}
        {tab === "Records" ? <Records /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview() {
  const f = activeFlock;
  return (
    <View className="gap-4">
      <Card>
        <Text className="mb-3 text-sm font-bold text-ink">Batch Information</Text>
        <InfoRow label="Started on" value="Oct 15, 2025" />
        <InfoRow label="Expected market" value="Dec 10, 2025" />
        <InfoRow label="Initial birds" value={f.initialBirds.toLocaleString("en-IN")} />
        <InfoRow label="Current birds" value={f.currentBirds.toLocaleString("en-IN")} />
        <InfoRow label="Mortality" value={`${f.metrics.mortalityCount} (${f.metrics.mortalityPct}%)`} last />
      </Card>
      <Card>
        <Text className="mb-3 text-sm font-bold text-ink">Performance</Text>
        <View className="flex-row">
          <Stat label="Avg. weight" value={`${f.metrics.avgWeightKg} kg`} sub="+0.05 kg" />
          <Divider />
          <Stat label="FCR" value={`${f.metrics.fcr}`} sub="on track" />
          <Divider />
          <Stat label="Weight gain" value={`${f.metrics.weightGainKgPerDay}`} sub="kg/day" />
        </View>
      </Card>
    </View>
  );
}

function Growth() {
  return (
    <Card>
      <Text className="mb-1 text-sm font-bold text-ink">Weight Trend (kg)</Text>
      <Text className="mb-3 text-xs text-ink-muted">
        Actual growth across the cycle
      </Text>
      <LineChart
        series={[{ data: weightTrend.map((p) => p.value), color: colors.brand }]}
      />
      <View className="mt-2 flex-row justify-between px-1">
        {weightTrend.map((p) => (
          <Text key={p.label} className="text-[10px] text-ink-faint">
            {p.label}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function Records() {
  return (
    <Card>
      <Text className="mb-3 text-sm font-bold text-ink">Recent Activity</Text>
      <View className="gap-3">
        {recentActivity.map((a) => {
          const cfg = activityIcon[a.kind];
          return (
            <View key={a.id} className="flex-row items-center">
              <Ionicons name={cfg.icon} size={18} color={colors.brand} />
              <Text className="ml-3 flex-1 text-sm text-ink">{a.label}</Text>
              <Text className="mr-3 text-sm font-semibold text-ink">{a.value}</Text>
              <Text className="text-[11px] text-ink-faint">{a.timestamp}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-base font-bold text-ink">{value}</Text>
      <Text className="mt-0.5 text-center text-[10px] text-ink-muted">{label}</Text>
      {sub ? <Text className="text-[10px] text-ink-faint">{sub}</Text> : null}
    </View>
  );
}

function Divider() {
  return <View className="w-px bg-border" />;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={`flex-row justify-between py-2.5 ${last ? "" : "border-b border-border"}`}
    >
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-semibold text-ink">{value}</Text>
    </View>
  );
}
