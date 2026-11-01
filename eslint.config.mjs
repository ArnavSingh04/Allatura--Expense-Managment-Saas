import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { files: ['**/*.cjs', 'next.config.js', 'postcss.config.js', 'tailwind.config.js'], languageOptions: { sourceType: 'commonjs' }, rules: { '@typescript-eslint/no-require-imports': 'off' } },
  globalIgnores(['.next/**', 'out/**', 'build/**', '.qa-agent-work/**', 'qa-raw/**', '.qa-cache/**', 'next-env.d.ts']),
]);
