import { resolve } from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  root: 'src',
  /**
   * clearScreen: true is a setting to clear the screen during test execution. The default is true.
   * When watching with multiple processes, it can clear results from other processes, so
   */
  clearScreen: false,
  plugins: [react()],
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'out'),
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      input: {
        '': resolve(__dirname, 'src/index.html'),
      },
    },
  },
})
