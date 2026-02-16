const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver = config.resolver || {};
config.resolver.useWatchman = false; // Avoid "Operation not permitted" on macOS
// Only watch app/ to avoid EMFILE (excludes node_modules)
config.watchFolders = [path.join(__dirname, 'app')];
config.maxWorkers = 1; // Reduce concurrent file ops
module.exports = config;
