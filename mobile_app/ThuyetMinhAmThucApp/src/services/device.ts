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

  /**
   * Lấy tổng RAM (MB).
   * Ưu tiên: Device.totalMemory (bytes) từ expo-device.
   * Fallback: estimate dựa trên model name.
   */
  private async getTotalRamMB(): Promise<number> {
    try {
      // expo-device exposes totalMemory (bytes) on supported platforms
      const total = (Device as any).totalMemory;
      if (total && total > 0) {
        return Math.round(total / (1024 * 1024));
      }
    } catch {}

    // Fallback: ước lượng dựa trên model name
    return this.estimateRamFromModel();
  }

  /** Fallback: estimate RAM từ model name (rough heuristic). */
  private estimateRamFromModel(): number {
    const model = (Device.modelName || "").toUpperCase();
    if (/RAM (6|8|12|16)GB/i.test(model)) {
      if (/16GB/i.test(model)) return 16384;
      if (/12GB/i.test(model)) return 12288;
      if (/8GB/i.test(model)) return 8192;
      if (/6GB/i.test(model)) return 6144;
    }
    if (/RAM (4|3)GB/i.test(model)) {
      if (/4GB/i.test(model)) return 4096;
      if (/3GB/i.test(model)) return 3072;
    }
    // Mặc định: giả định thiết bị tầm trung
    return 3072;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getDeviceId();

    // Storage
    let storageFreeMB = 0;
    try {
      const fsInfo = await FileSystem.getFreeDiskStorageAsync();
      storageFreeMB = Math.round(fsInfo / (1024 * 1024));
    } catch {}

    const osBuildId = Device.osVersion || "unknown";
    const modelName = Device.modelName || "unknown";

    const ramMB = await this.getTotalRamMB();

    // Network type — expo-device exposes some info
    let networkType: DeviceInfo["networkType"] = "CELLULAR_4G";

    return {
      deviceId,
      osVersion: `${modelName} (Android ${osBuildId})`,
      appVersion: Constants.expoConfig?.version || "1.0.0",
      ramMB,
      storageFreeMB,
      networkType,
    };
  }

  /**
   * OFFLINE: RAM >= MIN_RAM_MB && Storage >= MIN_STORAGE_MB
   * STREAMING: otherwise
   */
  determineRunningMode(deviceInfo: DeviceInfo): "OFFLINE" | "STREAMING" {
    if (
      deviceInfo.ramMB >= APP_CONFIG.MIN_RAM_MB &&
      deviceInfo.storageFreeMB >= APP_CONFIG.MIN_STORAGE_MB
    ) {
      return "OFFLINE";
    }
    return "STREAMING";
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
