import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    strictPort: false // Escolhe automaticamente a próxima porta desocupada se 5173 estiver em uso
  }
});
