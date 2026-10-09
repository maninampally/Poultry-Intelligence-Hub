import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, Card, LineChart, SegmentedControl } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { feedConsumption, fcrTrend, weightTarget, weightTrend } from "@/data/demo";

const PERIODS = ["7D", "30D", "3M", "6M", "1Y"];

/** B.8 Reports & Analytics — "Visualize performance and trends". */
export default function ReportsTab() {
  const [period, setPeriod] = useState("7D");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-ink">Reports</Text>
        <Text className="text-sm text-ink-muted">
          Understand your farm performance
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

        {/* Flock performance */}
        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">Flock Performance</Text>
          <View className="flex-row">
            <Perf label="Avg. weight" value="2.18 kg" delta="+5%" up />
            <Perf label="FCR" value="1.62" delta="-3%" up />
            <Perf label="Mortality" value="0.25%" delta="+1%" up={false} />
          </View>
        </Card>

        {/* Weight vs target */}
        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">Weight vs Target</Text>
            <View className="flex-row items-center gap-3">
              <Legend color={colors.inkFaint} label="Target" />
              <Legend color={colors.brand} label="Actual" />
            </View>
          </View>
          <LineChart
            series={[
              { data: weightTarget.map((p) => p.value), color: colors.inkFaint, dashed: true },
              { data: weightTrend.map((p) => p.value), color: colors.brand },
            ]}
          />
        </Card>

        {/* Feed consumption */}
        <Card>
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-ink">Feed Consumption</Text>
            <Text className="text-sm font-bold text-ink">1,240 kg</Text>
          </View>
          <Text className="mb-3 text-xs text-brand-600">↑ 8% vs. yesterday</Text>
          <BarChart
            data={feedConsumption.map((p) => p.value)}
            labels={feedConsumption.map((p) => p.label)}
          />
        </Card>

        {/* FCR trend */}
        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">FCR Trend</Text>
          <LineChart
            series={[{ data: fcrTrend.map((p) => p.value), color: colors.brand }]}
          />
        </Card>

        {/* Profitability */}
        <Card>
          <Text className="text-sm font-bold text-ink">Profitability</Text>
          <Text className="mt-1 text-2xl font-bold text-ink">₹42,500</Text>
          <Text className="text-xs text-ink-muted">
            Estimated profit (current flock)
          </Text>
          <Text className="mt-1 text-xs text-brand-600">↑ 12% vs. last cycle</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Perf({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-base font-bold text-ink">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-ink-muted">{label}</Text>
      <Text className={`text-[11px] font-semibold ${up ? "text-brand-600" : "text-danger"}`}>
        {delta}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[11px] text-ink-muted">{label}</Text>
    </View>
  );
}
