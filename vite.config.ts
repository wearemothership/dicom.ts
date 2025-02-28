import { defineConfig, Plugin } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from "vite-plugin-top-level-await";
import arraybuffer from 'vite-plugin-arraybuffer';
import vitePluginString from 'vite-plugin-string';

export default defineConfig({
  build: {
    minify: false, // TODO: Disable minification - remove
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        // './openjpeg.wasm',
        '@wearemothership/dicom-character-set',
        'jpeg-lossless-decoder-js',
        'pako',
        'sha1',
        'twgl.js'
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps if needed
        globals: {
          // Add if needed for UMD builds
        }
      }
    }
  },
  plugins: [
    nodePolyfills(),
    vitePluginString({
      include: '**/*.glsl',
      compress: false // TODO: compress messes with the shader
    }),
    arraybuffer(), // for wasm files
    topLevelAwait(), 
    dts({
      include: ['src'],
      rollupTypes: true
    })
  ],
}) 