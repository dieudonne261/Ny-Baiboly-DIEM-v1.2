const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions so expo-sqlite's wa-sqlite.wasm resolves on web
config.resolver.assetExts.push('wasm');

module.exports = config;
