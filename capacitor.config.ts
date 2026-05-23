import type { CapacitorConfig } from '@capacitor/cli';

const isAdmin = process.env.VITE_APP_TARGET === 'admin';

const config: CapacitorConfig = {
  appId: isAdmin ? 'in.vhop.admin' : 'in.vhop.app',
  appName: isAdmin ? 'VHOP Admin' : 'VHOP',
  webDir: 'dist',
  android: {
    path: isAdmin ? 'android-admin' : 'android'
  }
};

export default config;
