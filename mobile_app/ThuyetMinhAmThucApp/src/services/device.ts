import * as Device from "expo-device";
import * as FileSystem from "expo-file-system/legacy";
import Constants from "expo-constants";
import { APP_CONFIG } from "../constants";
import { DeviceInfo } from "../types";
import { storageService } from "./storage";

class DeviceService {
  private deviceId: string | null = null;

  async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;

    let stored = await storageService.getDeviceId();
    if (stored) {
      this.deviceId = stored;
      return stored;
    }

    // Generate new device ID
    this.deviceId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await storageService.setDeviceId(this.deviceId);
    return this.deviceId;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId();

    // Get storage info
    let storageFreeMB = 0;
    try {
      const fsInfo = await FileSystem.getFreeDiskStorageAsync();
      storageFreeMB = Math.round(fsInfo / (1024 * 1024));
    } catch {}

    // Get OS version
    const osVersion = Device.deviceName || "unknown";
    const osBuildId = Device.osVersion || "unknown";

    // Estimate RAM (expo-device doesn't expose RAM directly, use platform info)
    const platformData = Device.platformApiLevel;
    const modelName = Device.modelName || "unknown";

    // Determine network type (simplified - would need NetInfo in production)
    let networkType: DeviceInfo["networkType"] = "CELLULAR_4G";

    return {
      deviceId,
      osVersion: `${modelName} (Android ${osBuildId})`,
      appVersion: Constants.expoConfig?.version || "1.0.0",
      ramMB: 4096, // Default estimate
      storageFreeMB,
      networkType,
    };
  }

  /**
   * Determine running mode based on device capabilities.
   * OFFLINE: RAM >= 4GB, Storage >= 500MB
   * STREAMING: otherwise
   */
  determineRunningMode(deviceInfo: DeviceInfo): "OFFLINE" | "STREAMING" {
    if (
      deviceInfo.ramMB >= APP_CONFIG.MIN_RAM_MB &&       // RAM >= 4GB
      deviceInfo.storageFreeMB >= APP_CONFIG.MIN_STORAGE_MB // Ổ trống >= 500MB
    ) {
      return "OFFLINE";    // ✅ Đủ → tải audio về máy, chơi offline
    }
    return "STREAMING";   // ❌ Không đủ → chơi audio TRỰC TIẾP từ server mỗi lần
  }

  async isCapableOfOffline(): Promise<boolean> {
    const info = await this.getDeviceInfo();
    return (
      info.ramMB >= APP_CONFIG.MIN_RAM_MB &&
      info.storageFreeMB >= APP_CONFIG.MIN_STORAGE_MB
    );
  }

  async getTotalDownloadedMB(): Promise<number> {
    return storageService.getTotalOfflineSize();
  }
}

export const deviceService = new DeviceService();
