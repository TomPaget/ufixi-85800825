import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ufixi.app',
  appName: 'ufixi',
  webDir: 'dist',
  server: {
    url: 'https://80a0567e-90f7-4ccc-872e-fa8577cc429b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
