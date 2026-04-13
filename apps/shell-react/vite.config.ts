import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        kyc: resolve(__dirname, 'kyc.html')
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
