import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, AppState, AppStateStatus } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "./src/screens/SplashScreen";
import api from "./src/services/api";
import { deviceService } from "./src/services/device";

import * as Location from "expo-location";

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const sendHeartbeat = async () => {
      try {
        const deviceId = await deviceService.getDeviceId();
        let latParam = "";
        let lngParam = "";
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            const pos = await Location.getLastKnownPositionAsync();
            if (pos) {
              latParam = `&lat=${pos.coords.latitude}`;
              lngParam = `&lng=${pos.coords.longitude}`;
            }
          }
        } catch {}

        await api.post(`/api/v1/app/device/active-state?deviceId=${deviceId}&isActive=true${latParam}${lngParam}`);
      } catch (e) {
      }
    };

    const startHeartbeat = () => {
      sendHeartbeat(); // Gửi ngay lập tức
      heartbeatInterval = setInterval(sendHeartbeat, 5_000); // Mỗi 5 giây
    };

    const stopHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    };

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      try {
        const deviceId = await deviceService.getDeviceId();
        const isActive = nextAppState === "active";
        await api.post(`/api/v1/app/device/active-state?deviceId=${deviceId}&isActive=${isActive}`);
        if (isActive) {
          startHeartbeat();
        } else {
          stopHeartbeat();
        }
      } catch (e) {
        console.warn("Failed to update active state:", e);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Khởi động heartbeat ngay khi app load
    startHeartbeat();

    return () => {
      subscription.remove();
      stopHeartbeat();
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
