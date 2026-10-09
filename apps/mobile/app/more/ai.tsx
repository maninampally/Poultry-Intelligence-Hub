import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Input, ScreenHeader } from "@/components/ui";
import { colors } from "@/theme/tokens";
import { aiConversation, aiSuggestions } from "@/data/demo";
import { AiMessage } from "@/data/models";

/** B.11 AI Assistant — "Ask questions, get insights" (grounded in farm data). */
export default function AiScreen() {
  const [messages, setMessages] = useState<AiMessage[]>(aiConversation);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: t },
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "Based on your recorded data, this flock is tracking close to your best previous batches. I'll surface a full comparison once more days are logged.",
      },
    ]);
    setInput("");
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScreenHeader title="Poultry Intelligence AI" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {messages.map((m) =>
            m.role === "user" ? (
              <View key={m.id} className="max-w-[85%] self-end">
                <View className="rounded-2xl rounded-tr-sm bg-brand px-4 py-2.5">
                  <Text className="text-sm text-white">{m.text}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} className="max-w-[90%] self-start">
                <View className="flex-row items-start">
                  <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-brand-100">
                    <Ionicons name="sparkles" size={14} color={colors.brand} />
                  </View>
                  <Card className="flex-1">
                    <Text className="text-sm text-ink">{m.text}</Text>
                    {m.facts ? (
                      <View className="mt-3 gap-1.5">
                        {m.facts.map((fct) => (
                          <View
                            key={fct.label}
                            className="flex-row justify-between rounded-lg bg-cream px-3 py-2"
                          >
                            <Text className="text-xs text-ink-muted">
                              {fct.label}
                            </Text>
                            <Text className="text-xs font-bold text-ink">
                              {fct.value}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                </View>
              </View>
            ),
          )}

          {/* Suggested questions */}
          <View className="mt-2 gap-2">
            {aiSuggestions.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                className="self-start rounded-pill border border-brand-100 bg-surface px-3.5 py-2 active:opacity-80"
              >
                <Text className="text-xs font-medium text-brand-700">{s}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Composer */}
        <View className="flex-row items-center gap-2 border-t border-border bg-surface px-4 py-3">
          <View className="flex-1">
            <Input
              value={input}
              onChangeText={setInput}
              placeholder="Type your question..."
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            className="h-12 w-12 items-center justify-center rounded-full bg-brand active:opacity-90"
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
