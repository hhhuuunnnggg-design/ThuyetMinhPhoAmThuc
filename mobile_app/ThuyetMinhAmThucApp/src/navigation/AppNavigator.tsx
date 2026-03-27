import React, { useState, useEffect, useCallback } from "react";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import * as Location from "expo-location";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import POIDetailScreen from "../screens/POIDetailScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import PaymentScreen from "../screens/PaymentScreen";
import api from "../services/api";
import { unwrapListResponse } from "../utils/apiResponse";
import { storageService } from "../services/storage";
import { APP_CONFIG } from "../constants";
import { POI, NearbyPOI } from "../types";

export type RootStackParamList = {
  HomeTabs: undefined;
  POIDetail: { poi: POI };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number; quantity?: number; unitAmount?: number };
};

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  History: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    <Text style={styles.tabIconText}>{name}</Text>
  </View>
);

// MapScreenWrapper: load POIs 1 lần → chia sẻ cho HomeScreen + MapScreen
// Tránh load 2 lần khi chuyển tab
const MapScreenWrapper: React.FC = () => {
  const [pois, setPois] = useState<NearbyPOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferredLang, setPreferredLang] = useState("vi");

  useEffect(() => {
    storageService.getPreferredLanguage().then(setPreferredLang);
  }, []);

  useFocusEffect(
    useCallback(() => {
      storageService.getPreferredLanguage().then(setPreferredLang);
    }, [])
  );

  const loadPOIs = useCallback(async () => {
    setLoading(true);
    try {
      let nearbyPois: NearbyPOI[] = [];
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          const res: any = await api.get(
            `/api/v1/app/pois/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}&radiusKm=${APP_CONFIG.NEARBY_RADIUS_KM}`
          );
          nearbyPois = unwrapListResponse<NearbyPOI>(res.data);
        }
      } catch {}

      if (nearbyPois.length === 0) {
        const res: any = await api.get("/api/v1/app/pois");
        nearbyPois = unwrapListResponse<NearbyPOI>(res.data);
      }
      setPois(nearbyPois);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPOIs();
  }, [loadPOIs]);

  return (
    <MapScreen
      pois={pois}
      loading={loading}
      preferredLang={preferredLang}
      onPreferredLangChange={setPreferredLang}
    />
  );
};

const HomeTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#ff6b35",
      tabBarInactiveTintColor: "#999",
      tabBarStyle: {
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarLabel: "Trang chủ",
        tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Map"
      options={{
        tabBarLabel: "Bản đồ",
        tabBarIcon: ({ focused }) => <TabIcon name="🗺️" focused={focused} />,
      }}
    >
      {() => <MapScreenWrapper />}
    </Tab.Screen>
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: "Lịch sử",
        tabBarIcon: ({ focused }) => <TabIcon name="📜" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={SettingsScreen}
      options={{
        tabBarLabel: "Cài đặt",
        tabBarIcon: ({ focused }) => <TabIcon name="⚙️" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#ff6b35" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold", color: "#fff" },
      }}
    >
      <Stack.Screen
        name="HomeTabs"
        component={HomeTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="POIDetail"
        component={POIDetailScreen}
        options={{ title: "Chi tiết" }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Thanh toán" }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconFocused: {
    backgroundColor: "#fff3e0",
  },
  tabIconText: {
    fontSize: 16,
  },
});

export default AppNavigator;
