import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        remote: resolve(__dirname, 'src/remote.ts')
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'remote' ? 'remote/kyc-app.js' : 'assets/[name]-[hash].js')
      }
    }
  },
  server: {
    port: 5174
  }
});
