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
          input: resolve(__dirname, 'test.html'),
        },
      }
    : {
        copyPublicDir: false,
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          name: 'VueEffortSlider',
          fileName: 'vue-effort-slider',
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
