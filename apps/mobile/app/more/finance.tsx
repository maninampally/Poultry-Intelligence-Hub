import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, ScreenHeader, SegmentedControl } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { financeComparison } from "@/data/demo";

/** B.9 Finance / Batch Comparison — "Compare batches and track profitability". */
export default function FinanceScreen() {
  const [tab, setTab] = useState("Batch Comparison");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Finance" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          options={["Summary", "Batch Comparison"]}
          value={tab}
          onChange={setTab}
        />

        <Card padded={false}>
          {/* Header row */}
          <View className="flex-row border-b border-border px-4 py-3">
            <Text className="flex-1 text-xs font-semibold text-ink-muted">
              Metric
            </Text>
            <Text className="w-24 text-right text-xs font-semibold text-ink">
              Flock 07
            </Text>
            <Text className="w-24 text-right text-xs font-semibold text-ink-muted">
              Flock 06
            </Text>
          </View>
          {financeComparison.map((row, i) => (
            <View
              key={row.label}
              className={`flex-row px-4 py-3 ${
                i < financeComparison.length - 1 ? "border-b border-border" : ""
              }`}
              style={row.highlight ? { backgroundColor: colors.brandSoft } : undefined}
            >
              <Text
                className={`flex-1 text-sm ${
                  row.highlight ? "font-bold text-brand-700" : "text-ink-muted"
                }`}
              >
                {row.label}
              </Text>
              <Text
                className={`w-24 text-right text-sm ${
                  row.highlight ? "font-bold text-brand-700" : "font-semibold text-ink"
                }`}
              >
                {row.current}
              </Text>
              <Text className="w-24 text-right text-sm text-ink-muted">
                {row.previous}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
