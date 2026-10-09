import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { activeFlock, plannedFlocks } from "@/data/demo";

/** Flock tab — flock calendar (Active/Upcoming/Completed) + active flock entry. */
export default function FlockTab() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <View className="px-4 pb-2 pt-2">
        <Text className="text-xl font-bold text-ink">Flock Calendar</Text>
        <Text className="text-sm text-ink-muted">
          Plan your cycles for better results
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {plannedFlocks.map((flock) => (
          <Card
            key={flock.id}
            onPress={() => router.push(`/flock/${activeFlock.id}`)}
          >
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Ionicons name="egg" size={20} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-ink">{flock.name}</Text>
                <Text className="text-xs text-ink-muted">
                  Day {flock.ageDays} · {flock.birds.toLocaleString("en-IN")} birds
                </Text>
                <Text className="mt-0.5 text-[11px] text-ink-faint">
                  {flock.dateRange}
                </Text>
              </View>
              <Badge label="Healthy" tone="ok" dot />
            </View>
          </Card>
        ))}

        <View className="mt-2">
          <Button
            label="+ Add New Flock"
            variant="primary"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
