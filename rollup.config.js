import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node'
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
};