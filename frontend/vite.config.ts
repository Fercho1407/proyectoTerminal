import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto habilita el acceso desde la red (0.0.0.0)
    port: 5173, // (Opcional) Fijas el puerto por si acaso
  }
})
