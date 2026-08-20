const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use Watchman instead of Node FSEvents — avoids macOS EMFILE when other
// Metro/Expo apps (e.g. dwelis-frontend) are also running.
config.resolver = config.resolver || {};
config.resolver.useWatchman = true;
config.watcher = config.watcher || {};
config.watcher.watchman = {
  deferStates: ['hg.update'],
};

config.maxWorkers = 2;

module.exports = config;
