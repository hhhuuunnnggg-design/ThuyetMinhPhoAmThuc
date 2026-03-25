import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const STORAGE_KEYS = {
  DEVICE_ID: "device_id",
  DEVICE_CONFIG: "device_config",
  DOWNLOADED_VERSIONS: "downloaded_versions",
  OFFLINE_BUNDLES: "offline_bundles",
  PREFERRED_LANGUAGE: "preferred_language",
  OFFLINE_MODE_ENABLED: "offline_mode_enabled",
  LAST_POSITION: "last_position",
  NARRATION_HISTORY: "narration_history",
} as const;

class StorageService {
  // ============ Device ID ============

  async getDeviceId(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  }

  async setDeviceId(id: string): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  }

  // ============ Device Config ============

  async getDeviceConfig(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_CONFIG);
    return data ? JSON.parse(data) : null;
  }

  async setDeviceConfig(config: any): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.DEVICE_CONFIG, JSON.stringify(config));
  }

  // ============ Downloaded Versions ============

  async getDownloadedVersions(): Promise<Record<string, number>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_VERSIONS);
    return data ? JSON.parse(data) : {};
  }

  async setDownloadedVersion(poiId: string, version: number): Promise<void> {
    const versions = await this.getDownloadedVersions();
    versions[poiId] = version;
    return AsyncStorage.setItem(
      STORAGE_KEYS.DOWNLOADED_VERSIONS,
      JSON.stringify(versions)
    );
  }

  // ============ Offline Bundles ============

  async getOfflineBundlePath(poiId: number): string {
    return `${FileSystem.documentDirectory}offline/${poiId}/`;
  }

  async saveAudioOffline(poiId: number, lang: string, audioData: string): Promise<string> {
    const dir = await this.getOfflineBundlePath(poiId);
    const filePath = `${dir}${lang}.mp3`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    // Save audio file
    await FileSystem.writeAsStringAsync(filePath, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filePath;
  }

  async getLocalAudioPath(poiId: number, lang: string): Promise<string | null> {
    const filePath = `${await this.getOfflineBundlePath(poiId)}${lang}.mp3`;
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists ? filePath : null;
  }

  async deleteOfflineBundle(poiId: number): Promise<void> {
    const dir = await this.getOfflineBundlePath(poiId);
    const info = await FileSystem.getInfoAsync(dir);
    if (info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true });
    }
  }

  async getTotalOfflineSize(): Promise<number> {
    const dir = `${FileSystem.documentDirectory}offline/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(dir);
    let totalSize = 0;
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${dir}${file}`);
      if (fileInfo.exists && "size" in fileInfo) {
        totalSize += (fileInfo as any).size || 0;
      }
    }
    return Math.round(totalSize / (1024 * 1024)); // MB
  }

  // ============ Preferences ============

  async getPreferredLanguage(): Promise<string> {
    const lang = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_LANGUAGE);
    return lang || "vi";
  }

  async setPreferredLanguage(lang: string): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, lang);
  }

  async isOfflineModeEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE_ENABLED);
    return val === "true";
  }

  async setOfflineModeEnabled(enabled: boolean): Promise<void> {
    return AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_MODE_ENABLED,
      enabled ? "true" : "false"
    );
  }

  // ============ Narration History ============

  async getNarrationHistory(): Promise<any[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NARRATION_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  async addToNarrationHistory(entry: any): Promise<void> {
    const history = await this.getNarrationHistory();
    history.unshift({ ...entry, playedAt: new Date().toISOString() });
    // Keep only last 100 entries
    const trimmed = history.slice(0, 100);
    return AsyncStorage.setItem(
      STORAGE_KEYS.NARRATION_HISTORY,
      JSON.stringify(trimmed)
    );
  }

  // ============ Clear All ============

  async clearAll(): Promise<void> {
    return AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
