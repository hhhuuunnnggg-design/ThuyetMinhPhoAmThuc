import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import POIDetailScreen from "../screens/POIDetailScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import { POI } from "../types";

export type RootStackParamList = {
  HomeTabs: undefined;
  POIDetail: { poi: POI };
  QRScanner: undefined;
  Payment: { poi: POI; amount: number };
};

export type TabParamList = {
  Home: undefined;
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

const HistoryPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderEmoji}>📜</Text>
    <Text style={styles.placeholderText}>Lịch sử nghe</Text>
    <Text style={styles.placeholderSubtext}>Chưa có audio nào được phát</Text>
  </View>
);

const ProfilePlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderEmoji}>⚙️</Text>
    <Text style={styles.placeholderText}>Cài đặt</Text>
    <Text style={styles.placeholderSubtext}>Ngôn ngữ, chế độ offline</Text>
  </View>
);

const PaymentPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderEmoji}>💳</Text>
    <Text style={styles.placeholderText}>Thanh toán</Text>
    <Text style={styles.placeholderSubtext}>Tích hợp PayOS - đang phát triển</Text>
  </View>
);

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
      name="History"
      component={HistoryPlaceholder}
      options={{
        tabBarLabel: "Lịch sử",
        tabBarIcon: ({ focused }) => <TabIcon name="📜" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfilePlaceholder}
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
        headerTitleStyle: { fontWeight: "bold" },
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
        component={PaymentPlaceholder}
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
  placeholder: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});

export default AppNavigator;
