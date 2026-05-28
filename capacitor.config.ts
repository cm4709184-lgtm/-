import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schedule.app',
  appName: '课表解析应用',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    hostname: 'localhost',
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
