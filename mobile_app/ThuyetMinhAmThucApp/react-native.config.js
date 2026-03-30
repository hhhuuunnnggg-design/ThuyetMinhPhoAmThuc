/**
 * react-native.config.js
 *
 * Ngăn Metro bundler bundle expo-sqlite cho web.
 * expo-sqlite dùng WASM (wa-sqlite.wasm) — không tương thích với Metro web bundler.
 * Native app (iOS/Android) vẫn hoạt động bình thường.
 */
module.exports = {
  dependencies: {
    'expo-sqlite': {
      platforms: {
        ios: null,
        android: null,
        // web: null ← nghĩa là không bundle, app web sẽ dùng fallback hoặc crash nếu gọi
      },
    },
  },
};
