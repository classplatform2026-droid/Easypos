import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '../../services', replacement: path.resolve(__dirname, './src/services') },
      { find: '../../context', replacement: path.resolve(__dirname, './src/context') },
      { find: '../../types', replacement: path.resolve(__dirname, './src/types') },
      { find: '../components', replacement: path.resolve(__dirname, './src/components') },
      { find: '../services', replacement: path.resolve(__dirname, './src/services') },
      { find: '../context', replacement: path.resolve(__dirname, './src/context') },
    ],
  },
});
