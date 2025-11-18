import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.budva.tehniko',
  appName: 'Tehniko System',
  webDir: 'dist/public',
  server: {
    url: 'https://service-manager-bu2ninn8n.replit.app',
    cleartext: true
  }
};

export default config;

