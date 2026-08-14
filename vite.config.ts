import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Pure-function tests only for now (scoring, xp, unlocks, generators);
    // none of them touch the DOM, so the default node environment is enough.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
