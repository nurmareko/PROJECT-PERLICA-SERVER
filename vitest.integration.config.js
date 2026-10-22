import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import './test/integration/environment.js'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    include: ['test/integration/**/*.test.js'],
    globals: true,
    fileParallelism: false,
    setupFiles: ['./test/integration/setup.js'],
  },
})
