/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.viralsnap.helix',
  appName: 'Helix Empire',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Let @capawesome/...-edge-to-edge-support own WebView insets (avoids fighting Capacitor SystemBars).
    SystemBars: {
      insetsHandling: 'disable',
      style: 'Dark',
    },
    EdgeToEdge: {
      backgroundColor: '#000000',
      statusBarColor: '#000000',
      navigationBarColor: '#000000',
    },
    Keyboard: {
      resizeOnFullScreen: false,
    },
  },
};

export default config;
