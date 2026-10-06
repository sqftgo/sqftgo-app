// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude .agents folder from watch/resolve lists to avoid watcher errors
config.resolver.blockList = [
  /[/\\]\.agents[/\\]/,
];

module.exports = config;
