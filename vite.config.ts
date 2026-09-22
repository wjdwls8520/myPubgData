import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwind()], build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('/src/data/') && id.endsWith('.json')) return 'weapon-data'; if (id.includes('/node_modules/zod/')) return 'schema-validation'; } } } } });
