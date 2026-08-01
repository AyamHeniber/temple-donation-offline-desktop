/**
 * DonationBox - Temple Donation Receipt Management
 * Copyright (c) 2026 Ayam Heniber Meitei
 * Developed by Ayam Heniber Meitei <ayamheniber0@gmail.com>
 */

import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'

const alias = {
  '@': path.resolve(__dirname, 'src'),
}

const mainExternals = ['electron', '@prisma/client', '.prisma/client', 'exceljs']

export default defineConfig(({ command }) => {
  const isServe = command === 'serve'

  return {
    resolve: { alias },
    plugins: [
      react(),
      electron({
        main: {
          entry: 'src/electron/main.ts',
          onstart: (args) => args.startup(),
          vite: {
            resolve: { alias },
            build: {
              outDir: 'dist-electron',
              minify: !isServe,
              sourcemap: isServe ? 'inline' : false,
              rollupOptions: { external: mainExternals },
            },
          },
        },
        preload: {
          input: 'src/electron/preload.ts',
          vite: {
            resolve: { alias },
            build: {
              outDir: 'dist-electron',
              minify: !isServe,
              sourcemap: isServe ? 'inline' : false,
              rollupOptions: { external: ['electron'] },
            },
          },
        },
      }),
      renderer(),
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    clearScreen: false,
  }
})
