import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, ScreenHeader, SegmentedControl } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { historicalBatches } from "@/data/demo";

/** B.10 Historical Batches (Archive) — "Access past data when you need it". */
export default function HistoryScreen() {
  const [tab, setTab] = useState("Completed");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Flock History" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          options={["Active", "Completed", "Archived"]}
          value={tab}
          onChange={setTab}
        />

        <View className="gap-3">
          {historicalBatches.map((b) => (
            <Card key={b.id}>
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                  <Ionicons name="egg" size={20} color={colors.brand} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-ink">{b.name}</Text>
                  <Text className="text-xs text-ink-muted">
                    Day {b.ageDays} · {b.birds.toLocaleString("en-IN")} birds
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-ink-faint">
                    {b.dateRange}
                  </Text>
                </View>
                <Badge label="Completed" tone="ok" />
              </View>
              <View className="mt-3 flex-row border-t border-border pt-3">
                <View className="flex-1">
                  <Text className="text-[11px] text-ink-muted">FCR</Text>
                  <Text className="text-sm font-bold text-ink">{b.fcr}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-ink-muted">Profit</Text>
                  <Text className="text-sm font-bold text-brand-700">{b.profit}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View className="mt-1">
          <Button label="View All Batches" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
