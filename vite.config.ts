import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [
      react({
        fastRefresh: true,
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    server: {
      host: true,
      port: 5173,
      open: false,
      strictPort: true,
      fs: {
        strict: false,
      },
    },

    build: {
      target: 'esnext',
      sourcemap: false, // 🔥 8GB軽量化
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
    },

    esbuild: {
      drop: isDev ? [] : ['console', 'debugger'], // 本番console削除
    },
  }
})