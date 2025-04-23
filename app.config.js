export default {
  name: "Talk App",
  slug: "talk-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.talkapp",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: "com.talkapp",
  },
  web: {
    favicon: "./assets/images/favicon.png",
  },
  extra: {
    apiUrl: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://talkk-api.onrender.com',
    eas: {
      projectId: "your-project-id",
    },
  },
  plugins: [
    "expo-router",
  ],
}; 