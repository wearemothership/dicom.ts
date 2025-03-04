import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import topLevelAwait from "vite-plugin-top-level-await"
import arraybuffer from 'vite-plugin-arraybuffer'
import vitePluginString from 'vite-plugin-string'

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    exclude: [
		  "example/**",
		  "example-vs-cornerstone/**",
	  ],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'src/index.test.js'],
  },
  plugins: [
    nodePolyfills(),
    vitePluginString({
      include: '**/*.glsl',
      compress: false // TODO: compress messes with the shader
    }),
    arraybuffer(), // for wasm files
    topLevelAwait(), 
    // dts({
    //   include: ['src'],
    //   rollupTypes: true
    // })
  ]
})
