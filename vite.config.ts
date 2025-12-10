import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Garante que caminhos relativos funcionem em subpastas ou na raiz
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});