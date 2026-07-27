import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.viralsnap.helix',
  appName: 'Helix Empire',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      // Helix Empire AdMob App ID
      // Replace with real ID when available in Netlify
      appId: 'ca-app-pub-3940256099942544~3347511713',
    }
  }
};

export default config;
