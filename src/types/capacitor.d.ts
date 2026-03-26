declare module "@capacitor-community/app-tracking-transparency" {
  export const AppTrackingTransparency: {
    getStatus: () => Promise<{ status: string }>;
    requestPermission: () => Promise<{ status: string }>;
  };
}

interface Window {
  Capacitor?: {
    isNativePlatform: () => boolean;
    getPlatform: () => "ios" | "android" | "web";
  };
}
