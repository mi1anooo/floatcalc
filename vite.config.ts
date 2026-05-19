import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development
  // Prevents Vite from obscuring Rust errors
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tauri expects a constant port; tell Vite to ignore src-tauri changes
      ignored: ['**/src-tauri/**'],
    },
  },
}));
