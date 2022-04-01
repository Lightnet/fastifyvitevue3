
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Inspect from 'vite-plugin-inspect'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
//import ViteRestart from 'vite-plugin-restart'
//console.log(ViteRestart)

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname)

export default defineConfig({

  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    Vue(),
    Layouts(),
    Pages({
      extensions: ['vue'],
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
      ],
      dts: 'src/auto-imports.d.ts'
    }),
    // https://github.com/antfu/unplugin-vue-components
    Components({
      // relative paths to the directory to search for components
      dirs: ['src/**/components'],
      
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue'],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/],

      dts: 'src/components.d.ts'
    }),
    // https://github.com/antfu/vite-plugin-inspect
    Inspect({
      // change this to enable inspect for debugging
      enabled: false,
    }),

    // https://github.com/antfu/vite-plugin-restart // does not work
    //ViteRestart({
      //restart: ['../../dist/*.js'],
      //restart: ['./dist/*.js'],
    //}),
  ],
  build: {
    minify: false,
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router'
    ],
    exclude: [
      'vue-demi'
    ]
  },
});