import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      // On dit à Vitest que @ pointe vers le dossier src
      '@': path.resolve(__dirname, './src'),
    },
  },
})