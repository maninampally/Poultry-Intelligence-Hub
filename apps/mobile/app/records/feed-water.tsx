import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart,
  Card,
  LineChart,
  ScreenHeader,
  SegmentedControl,
} from "@/components/ui";
import { colors } from "@/theme/tokens";
import { feedConsumption, waterConsumption } from "@/data/demo";

/** B.5 Feed & Water Tracking — "Monitor consumption and trends". */
export default function FeedWaterScreen() {
  const [tab, setTab] = useState("Feed");
  const isFeed = tab === "Feed";
  const series = isFeed ? feedConsumption : waterConsumption;
  const unit = isFeed ? "kg" : "L";
  const today = isFeed ? "1,240" : "3,420";
  const weeklyAvg = isFeed ? "1,150" : "3,180";

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Feed & Water" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          options={["Feed", "Water"]}
          value={tab}
          onChange={setTab}
        />

        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">
            {tab} Consumption ({unit})
          </Text>
          <BarChart
            data={series.map((p) => p.value)}
            labels={series.map((p) => p.label)}
          />
        </Card>

        <View className="flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-xs text-ink-muted">Today</Text>
            <Text className="mt-1 text-lg font-bold text-ink">
              {today} {unit}
            </Text>
            <Text className="mt-0.5 text-[11px] text-brand-600">
              +8% vs. yesterday
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-ink-muted">Weekly Average</Text>
            <Text className="mt-1 text-lg font-bold text-ink">
              {weeklyAvg} {unit}
            </Text>
            <Text className="mt-0.5 text-[11px] text-ink-faint">last 7 days</Text>
          </Card>
        </View>

        <Card>
          <Text className="mb-3 text-sm font-bold text-ink">
            {tab} Consumption Trend
          </Text>
          <LineChart
            series={[{ data: series.map((p) => p.value), color: colors.brand }]}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
