import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, Input, ScreenHeader } from "@/components/ui";
import { StatusTone, colors } from "@/theme/tokens";
import { todayRecord } from "@/data/demo";

interface EntryRow {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTone: StatusTone;
  label: string;
  value: string;
  unit: string;
  expected: string;
  statusLabel: string;
  statusTone: StatusTone;
}

/** B.4 Add Daily Record — "Quick and easy data entry". */
export default function DailyRecordScreen() {
  const r = todayRecord;
  const [rows] = useState<EntryRow[]>([
    {
      key: "feed",
      icon: "nutrition",
      iconTone: "warning",
      label: "Feed",
      value: r.feedKg.toLocaleString("en-IN"),
      unit: "kg",
      expected: `Expected: ${r.feedExpectedKg.toLocaleString("en-IN")}`,
      statusLabel: "Normal",
      statusTone: "ok",
    },
    {
      key: "water",
      icon: "water",
      iconTone: "info",
      label: "Water",
      value: r.waterL.toLocaleString("en-IN"),
      unit: "L",
      expected: `Expected: ${r.waterExpectedL.toLocaleString("en-IN")}`,
      statusLabel: "Normal",
      statusTone: "ok",
    },
    {
      key: "mortality",
      icon: "alert-circle",
      iconTone: "critical",
      label: "Mortality",
      value: `${r.mortality}`,
      unit: "birds",
      expected: `Expected: ${r.mortalityExpectedRange[0]}-${r.mortalityExpectedRange[1]}`,
      statusLabel: "0.25%",
      statusTone: "critical",
    },
    {
      key: "weight",
      icon: "scale",
      iconTone: "ok",
      label: "Average weight",
      value: `${r.avgWeightKg}`,
      unit: "kg",
      expected: `Expected: ${r.avgWeightExpectedKg}`,
      statusLabel: "Normal",
      statusTone: "ok",
    },
  ]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = () => {
    setSaving(true);
    // Offline-first: this would queue an event to the local outbox / sync engine.
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 500);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Daily Record" />

      {/* Date stepper */}
      <View className="flex-row items-center justify-between bg-surface px-4 py-3">
        <Pressable hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.inkMuted} />
        </Pressable>
        <Text className="text-sm font-semibold text-ink">Fri, Sep 26, 2025</Text>
        <Pressable hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {rows.map((row) => (
          <Card key={row.key}>
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.brandSoft }}
              >
                <Ionicons name={row.icon} size={20} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-ink-muted">
                  {row.label}
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-lg font-bold text-ink">{row.value}</Text>
                  <Text className="ml-1 text-sm text-ink-muted">{row.unit}</Text>
                </View>
                <Text className="text-[11px] text-ink-faint">{row.expected}</Text>
              </View>
              <Badge label={row.statusLabel} tone={row.statusTone} />
            </View>
          </Card>
        ))}

        <View className="mt-1">
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            multiline
          />
        </View>

        <View className="mt-2">
          <Button label="Save Record" onPress={onSave} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
