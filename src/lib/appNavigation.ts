export function isNativeApp() {
  return (
    typeof window !== "undefined" &&
    window.Capacitor !== undefined &&
    window.Capacitor.isNativePlatform()
  );
}

export function getInAppPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return isNativeApp() ? `#${normalizedPath}` : normalizedPath;
}
