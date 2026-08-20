import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate from vite.config.ts on purpose: the PWA plugin has no business
// running during unit tests, and Tailwind is not needed to assert behaviour.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // jsdom start-up plus user-event interaction is slow on Windows.
    testTimeout: 20000,
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
})
