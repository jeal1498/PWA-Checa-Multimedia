import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// La landing se compila a ../registro/ (GitHub Pages la sirve en /PWA-Checa-Multimedia/registro/).
// base './' deja todas las rutas relativas, así funciona en cualquier subcarpeta.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../registro',
    emptyOutDir: true,
    target: 'es2019',
  },
});
