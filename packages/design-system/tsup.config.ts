import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  entry: ['src/index.ts', 'src/cn.ts', 'src/preset.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    copyFileSync(
      resolve('src/styles.css'),
      resolve('dist/styles.css'),
    );
  },
});
