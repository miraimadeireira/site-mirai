import { defineConfig } from 'vite';

export default defineConfig({
  // caminhos relativos: o build funciona em qualquer pasta ou domínio
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
});
