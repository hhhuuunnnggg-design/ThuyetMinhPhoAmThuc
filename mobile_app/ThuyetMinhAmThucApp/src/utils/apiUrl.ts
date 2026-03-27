import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Device from "expo-device";

const EXTRA_API_URL = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.trim();

const BACKEND_PORT = 8080;

function isLoopbackOrAndroidEmuHost(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "10.0.2.2";
  } catch {
    return true;
  }
}

/**
 * Expo dev: hostUri giống Metro (vd 192.168.1.5:8081) → lấy IP máy chạy backend.
 */
function inferDevMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && typeof hostUri === "string") {
    const host = hostUri.split(":")[0]?.trim();
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host;
    }
  }
  return null;
}

/**
 * - Web: localhost
 * - Android emulator (không phải máy thật): 10.0.2.2
 * - iOS simulator: localhost
 * - Máy thật + Expo Go: ưu tiên extra.apiBaseUrl (IP LAN), không thì suy ra từ hostUri
 */
export const getApiBaseUrl = (): string => {
  if (Platform.OS === "web") {
    return `http://localhost:${BACKEND_PORT}`;
  }

  const isRealDevice = Device.isDevice === true;
  const isAndroid = Platform.OS === "android" || Constants.platform?.android;
  const inferredHost = inferDevMachineHost();
  const inferredUrl = inferredHost ? `http://${inferredHost}:${BACKEND_PORT}` : null;

  // extra hợp lệ cho máy thật: IP LAN / tên miền (không phải localhost / 10.0.2.2)
  if (EXTRA_API_URL && !isLoopbackOrAndroidEmuHost(EXTRA_API_URL)) {
    return EXTRA_API_URL;
  }

  // Android emulator
  if (isAndroid && !isRealDevice) {
    if (EXTRA_API_URL?.includes("10.0.2.2")) return EXTRA_API_URL;
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  // iOS simulator
  if (Platform.OS === "ios" && !isRealDevice) {
    return `http://localhost:${BACKEND_PORT}`;
  }

  // Máy thật: không được dùng localhost hay 10.0.2.2
  if (isRealDevice) {
    if (inferredUrl) {
      return inferredUrl;
    }
    if (__DEV__) {
      console.warn(
        `[api] Không suy ra được IP máy dev (hostUri trống). Đặt trong app.json → expo.extra.apiBaseUrl ` +
          `ví dụ: "http://192.168.1.x:${BACKEND_PORT}" (cùng Wi‑Fi với điện thoại).`
      );
    }
  }

  // Fallback (simulator edge cases)
  if (inferredUrl) return inferredUrl;
  if (isAndroid) return `http://10.0.2.2:${BACKEND_PORT}`;
  return `http://localhost:${BACKEND_PORT}`;
};
