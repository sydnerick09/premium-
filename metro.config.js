const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts
    .filter((ext) => ext !== 'svg')
    .concat(['lottie', 'ttf', 'otf']),
  sourceExts: [...config.resolver.sourceExts, 'svg', 'cjs', 'mjs'],
  // Web platform stubs for native-only packages
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web') {
      // Stub out native Firebase modules
      if (
        moduleName === '@react-native-firebase/app' ||
        moduleName === '@react-native-firebase/auth' ||
        moduleName === '@react-native-firebase/firestore' ||
        moduleName === '@react-native-firebase/storage' ||
        moduleName === '@react-native-firebase/analytics' ||
        moduleName === '@react-native-firebase/crashlytics'
      ) {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/firebase.stub.js') };
      }
      // Stub out MMKV
      if (moduleName === 'react-native-mmkv') {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/mmkv.stub.js') };
      }
      // Stub out RevenueCat
      if (moduleName === 'react-native-purchases') {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/purchases.stub.js') };
      }
      // Stub out expo-haptics on web (no vibration API)
      if (moduleName === 'expo-haptics') {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/haptics.stub.js') };
      }
      // Stub out expo-image on web (not installed; use RN Image)
      if (moduleName === 'expo-image') {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'stubs/expo-image.stub.js') };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
