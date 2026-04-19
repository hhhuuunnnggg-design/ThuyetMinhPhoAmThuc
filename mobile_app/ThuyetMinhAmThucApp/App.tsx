import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, AppState, AppStateStatus } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "./src/screens/SplashScreen";
import api from "./src/services/api";
import { deviceService } from "./src/services/device";

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      try {
        const deviceId = await deviceService.getDeviceId();
        const isActive = nextAppState === "active";
        await api.post(`/api/v1/app/device/active-state?deviceId=${deviceId}&isActive=${isActive}`);
      } catch (e) {
        console.warn("Failed to update active state:", e);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    
    // Set active immediately when the app loads
    handleAppStateChange("active");

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isReady) {
    return <SplashScreen onReady={() => setIsReady(true)} />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
