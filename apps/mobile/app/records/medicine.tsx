import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  Button,
  Card,
  ScreenHeader,
  SegmentedControl,
} from "@/components/ui";
import { colors } from "@/theme/tokens";
import { medications, vaccinations } from "@/data/demo";

/** B.7 Medicine & Vaccination — "Track treatments and schedules". */
export default function MedicineScreen() {
  const [tab, setTab] = useState("Medicine");

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Medicine & Vaccination" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <SegmentedControl
          options={["Medicine", "Vaccination"]}
          value={tab}
          onChange={setTab}
        />

        {tab === "Medicine" ? (
          <View>
            <Text className="mb-2 text-sm font-bold text-ink">
              Current Medications
            </Text>
            <View className="gap-3">
              {medications.map((m) => (
                <Card key={m.id}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                      <Ionicons name="medkit" size={20} color={colors.brand} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-ink">{m.name}</Text>
                      <Text className="text-xs text-ink-muted">
                        {m.startDate} – {m.endDate}
                      </Text>
                      <Text className="text-[11px] text-ink-faint">
                        Day {m.currentDay} of {m.totalDays}
                      </Text>
                    </View>
                    <Badge label="Ongoing" tone="ok" dot />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Text className="mb-2 text-sm font-bold text-ink">
              Vaccination Schedule
            </Text>
            <View className="gap-3">
              {vaccinations.map((v) => (
                <Card key={v.id}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                      <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color={colors.brand}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-ink">{v.name}</Text>
                      <Text className="text-xs text-ink-muted">{v.date}</Text>
                    </View>
                    <Badge label="Upcoming" tone="warning" />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        <View className="mt-2">
          <Button label="Add Record" onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
