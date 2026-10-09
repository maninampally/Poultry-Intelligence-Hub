import { router } from "expo-router";
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
import { Button, Input, Logo } from "@/components/ui";
import { colors } from "@/theme/tokens";

/** B.1 Login — "Secure access to your farm data". */
export default function LoginScreen() {
  const [mobile, setMobile] = useState("+91 98765 43210");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = () => {
    setLoading(true);
    // Demo mode: no backend call; proceed into the app.
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)");
    }, 500);
  };

  return (
    <View className="flex-1 bg-brand">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand hero */}
            <View className="items-center px-6 pb-8 pt-12">
              <Logo size="lg" showTagline onDark />
              <Text className="mt-3 text-center text-sm text-white/80">
                Smart Poultry Management for a Healthier Tomorrow
              </Text>
            </View>

            {/* Card sheet */}
            <View className="flex-1 rounded-t-[28px] bg-cream px-6 pt-8">
              <Text className="text-2xl font-bold text-ink">Welcome Back</Text>
              <Text className="mb-6 mt-1 text-sm text-ink-muted">
                Sign in to continue
              </Text>

              <View className="gap-4">
                <Input
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secure
                />
              </View>

              <View className="mt-6">
                <Button label="Login" onPress={onLogin} loading={loading} />
              </View>

              <Pressable className="mt-4 self-center" hitSlop={8}>
                <Text className="text-sm font-medium text-brand-600">
                  Forgot Password?
                </Text>
              </Pressable>

              <View className="mt-8 flex-row justify-center">
                <Text className="text-sm text-ink-muted">
                  Don&apos;t have an account?{" "}
                </Text>
                <Pressable hitSlop={8}>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.brand }}
                  >
                    Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
