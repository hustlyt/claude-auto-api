const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const terser = require('@rollup/plugin-terser')

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    sourcemap: false,
    inlineDynamicImports: true
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    terser({
      compress: {
        drop_console: false, // 保留console输出，CLI工具需要
        drop_debugger: true
      },
      mangle: {
        keep_fnames: true // 保留函数名，便于调试
      },
      format: {
        comments: false // 移除注释
      }
    })
  ],
  external: ['fs', 'path', 'os', 'util']
}
