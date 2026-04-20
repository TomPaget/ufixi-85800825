import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ufixi.app',
  appName: 'ufixi',
  webDir: 'dist',
  hooks: {
    // Auto-patch ios/App/App/Info.plist after every `npx cap sync` so all
    // App Store + AdMob keys (SKAdNetworkItems, ATT, ATS, encryption, photo
    // permissions, GADApplicationIdentifier) stay in sync.
    'capacitor:sync:after': 'node scripts/patch-ios-info-plist.mjs',
    'capacitor:copy:after': 'node scripts/patch-ios-info-plist.mjs',
  },
};

export default config;
