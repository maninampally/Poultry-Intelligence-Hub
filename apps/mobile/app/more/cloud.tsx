import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, ScreenHeader } from "@/components/ui";
import { colors } from "@/theme/tokens";

const assurances = [
  "Data stored securely in the cloud",
  "Automatic backup",
  "Access from any device",
  "Bank-grade encryption",
];

/** B.12 Cloud & Security — "Your data, always safe". */
export default function CloudScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Cloud & Security" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Hero */}
        <View className="items-center py-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-50">
            <Ionicons name="cloud-done" size={40} color={colors.brand} />
          </View>
          <Text className="mt-4 text-lg font-bold text-ink">
            Your data, always safe
          </Text>
        </View>

        {/* Assurances */}
        <Card padded={false}>
          {assurances.map((a, i) => (
            <View
              key={a}
              className={`flex-row items-center px-4 py-3.5 ${
                i < assurances.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
              <Text className="ml-3 text-sm font-medium text-ink">{a}</Text>
            </View>
          ))}
        </Card>

        {/* Reassurance */}
        <View
          className="flex-row items-center rounded-card p-4"
          style={{ backgroundColor: colors.brandSoft }}
        >
          <Ionicons name="shield-checkmark" size={22} color={colors.brand} />
          <Text className="ml-3 flex-1 text-sm font-medium text-brand-700">
            Your farm data is safe with Poultry Intelligence.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
