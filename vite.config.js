import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const isPlayground = process.env.BUILD_TARGET === 'playground'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: isPlayground
    ? {
        outDir: 'dist-playground',
        emptyOutDir: true,
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
        },
      }
    : {
        copyPublicDir: false,
        lib: {
          entry: {
            'vue-effort-slider': resolve(__dirname, 'src/index.js'),
            composables: resolve(__dirname, 'src/composables.js'),
            shaders: resolve(__dirname, 'src/shaders.js'),
          },
          formats: ['es', 'cjs'],
          fileName: (format, entryName) =>
            `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            exports: 'named',
            globals: {
              vue: 'Vue',
            },
          },
        },
      },
  server: {
    open: '/test.html',
  },
})
