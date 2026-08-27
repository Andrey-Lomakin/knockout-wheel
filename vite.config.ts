import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Относительные пути — чтобы сборка работала на GitHub Pages (в подпапке /repo/)
  // и на любом другом статическом хостинге без учёта пути.
  base: './',
});