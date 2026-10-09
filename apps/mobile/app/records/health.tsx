import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertBanner,
  BarChart,
  Card,
  ScreenHeader,
  SegmentedControl,
} from "@/components/ui";
import { colors } from "@/theme/tokens";

const dailyMortality = [3, 5, 4, 6, 8, 10, 12];
const mortalityLabels = ["20", "21", "22", "23", "24", "25", "26"];

/** B.6 Health & Mortality — "Keep your flock healthy". */
export default function HealthScreen() {
  const [tab, setTab] = useState("Health");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Health & Mortality" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          options={["Health", "Mortality"]}
          value={tab}
          onChange={setTab}
        />

        {tab === "Health" ? (
          <>
            <Card>
              <Text className="mb-3 text-sm font-bold text-ink">Current Status</Text>
              <View className="flex-row items-center">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                  <Ionicons name="checkmark-circle" size={24} color={colors.brand} />
                </View>
                <View>
                  <Text className="text-base font-bold text-ink">Healthy</Text>
                  <Text className="text-xs text-ink-muted">
                    No major issues detected
                  </Text>
                </View>
              </View>
            </Card>

            <View>
              <Text className="mb-2 text-sm font-bold text-ink">Recent Alerts</Text>
              <View className="gap-2.5">
                <AlertBanner
                  title="Feed consumption"
                  message="8% higher than yesterday."
                  tone="warning"
                />
                <AlertBanner
                  title="Water consumption"
                  message="Normal range."
                  tone="ok"
                />
                <AlertBanner
                  title="Mortality"
                  message="Within expected range."
                  tone="ok"
                />
              </View>
            </View>

            <Card>
              <Text className="mb-2 text-sm font-bold text-ink">Health Tips</Text>
              <Text className="text-xs leading-5 text-ink-muted">
                Ensure proper ventilation and maintain water quality. Check for
                uniform feed access across the shed.
              </Text>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <Text className="mb-3 text-sm font-bold text-ink">
                Daily Mortality
              </Text>
              <BarChart
                data={dailyMortality}
                labels={mortalityLabels}
                color={colors.danger}
              />
            </Card>
            <View className="flex-row gap-3">
              <Card className="flex-1">
                <Text className="text-xs text-ink-muted">Today</Text>
                <Text className="mt-1 text-lg font-bold text-ink">12 birds</Text>
                <Text className="mt-0.5 text-[11px] text-danger">0.25%</Text>
              </Card>
              <Card className="flex-1">
                <Text className="text-xs text-ink-muted">Cumulative</Text>
                <Text className="mt-1 text-lg font-bold text-ink">180 birds</Text>
                <Text className="mt-0.5 text-[11px] text-danger">3.6%</Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
