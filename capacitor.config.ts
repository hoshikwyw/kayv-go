import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.kayvgo.app',
  appName: 'Kayv Go',
  // Capacitor ships whatever `npm run build` produced.
  webDir: 'dist',
  server: {
    // Serve from https://localhost rather than http://, so the webview treats
    // the app as a secure context - Supabase auth and the camera need that.
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#f8fafc',
  },
}

export default config
