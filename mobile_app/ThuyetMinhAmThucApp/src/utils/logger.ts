import * as FileSystem from "expo-file-system/legacy";

const LOG_FILE_PATH = FileSystem.documentDirectory + "qr_scan_log.txt";

class LoggerService {
  async logQRScan(deviceInfo: any, lat: number | null, lng: number | null, poiCode: string) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] QR Scanned: ${poiCode}\nDevice ID: ${deviceInfo.deviceId}\nOS: ${deviceInfo.osVersion}\nApp: ${deviceInfo.appVersion}\nRAM: ${deviceInfo.ramMB}MB\nStorage Free: ${deviceInfo.storageFreeMB}MB\nNetwork: ${deviceInfo.networkType}\nLocation: ${lat}, ${lng}\n----------------------------------------\n`;

      const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(LOG_FILE_PATH, logEntry, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        // Read existing and append because expo-file-system/legacy doesn't have a direct append in some versions
        // actually append is available via writeAsStringAsync with encoding (wait, no, legacy might not support append mode natively or read/write is fine since file won't be that huge).
        // A better way is using readAsString then write, or use FileSystem.StorageAccessFramework
        const existingLog = await FileSystem.readAsStringAsync(LOG_FILE_PATH, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await FileSystem.writeAsStringAsync(LOG_FILE_PATH, existingLog + logEntry, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      console.log("Log saved to:", LOG_FILE_PATH);
    } catch (error) {
      console.error("Failed to write log file:", error);
    }
  }

  async getLogs(): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
      if (fileInfo.exists) {
        return await FileSystem.readAsStringAsync(LOG_FILE_PATH, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
    } catch (error) {
      console.error("Failed to read log file:", error);
    }
    return "No logs found.";
  }

  async clearLogs() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(LOG_FILE_PATH);
        console.log("Logs cleared.");
      }
    } catch (error) {
      console.error("Failed to clear log file:", error);
    }
  }
}

export const loggerService = new LoggerService();
