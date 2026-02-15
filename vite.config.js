import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  appType: 'spa',
});
