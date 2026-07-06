import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.viralsnap.helix',
  appName: 'Helix Empire',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
