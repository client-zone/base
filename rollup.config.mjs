import { nodeResolve } from '@rollup/plugin-node-resolve'

export default [
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.mjs',
      format: 'esm'
    },
    external: [],
    plugins: [nodeResolve({ preferBuiltins: true })]
  }
]
