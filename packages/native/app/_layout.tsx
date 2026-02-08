import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth/store";
import { Providers } from "@/lib/components/Providers";

import "../global.css";

const isWeb = process.env.EXPO_OS === "web";

if (!isWeb) {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const { user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [_hasHydrated]);

  if (!_hasHydrated && !isWeb) {
    return null;
  }

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(logged-in)" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(logged-out)" />
        </Stack.Protected>
      </Stack>
    </Providers>
  );
}
