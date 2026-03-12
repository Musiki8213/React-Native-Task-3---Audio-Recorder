import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";

// Keep the splash screen visible while we load (optional; remove if you want native default)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide the splash screen once the root layout has mounted and the app is ready
    SplashScreen.hideAsync();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
