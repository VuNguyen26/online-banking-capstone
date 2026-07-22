import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test:
                /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'ethers-vendor',
              test:
                /node_modules[\\/](ethers|@noble|@adraffy|aes-js)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              minSize: 20_000,
              maxSize: 250_000,
              priority: 10,
            },
          ],
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    clearMocks: true,
    restoreMocks: true,
  },
})
