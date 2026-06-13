module.exports = {
  expo: {
    name: 'PickUs',
    slug: 'PickUs',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/images/logo.jpeg',
    scheme: 'pickus',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      supportsRTL: true,
      router: {},
      eas: {
        projectId: '1eafd143-2b2d-4b5e-9797-7234ef9a8d28',
      },
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'This app needs access to your location for real-time tracking on the map.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        backgroundImage: './src/assets/images/logo.jpeg',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      supportsRTL: true,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
      ],
      package: 'com.colman.PickUs',
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      output: 'static',
      favicon: './src/assets/images/logo.jpeg',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './src/assets/images/logo.jpeg',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    owner: 'natan-sinai',
  },
};
