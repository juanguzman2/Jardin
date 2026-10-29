const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Migraciones de Drizzle (.sql) y SQLite en web (.wasm, solo para pruebas en el navegador).
config.resolver.sourceExts.push('sql');
config.resolver.assetExts.push('wasm');

module.exports = config;
