import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react() as PluginOption], // not sure why the cast is needed
  server: {
    host: true,
    port: 3000
  }
})
