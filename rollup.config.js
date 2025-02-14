import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist/browser',
      format: 'es',
      sourcemap: true,
    }
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.browser.json',
      declaration: true,
      declarationDir: 'dist/browser',
      sourceMap: true,
    })
  ],
  external: [
    // List any external dependencies that should not be bundled
  ]
};