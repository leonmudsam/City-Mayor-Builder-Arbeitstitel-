import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // *.gen.ts: von tools/bakeWorld.mjs generierte Daten-Dateien (Megabyte an
  // base64-Literalen) — nie von Hand editiert, Linting wäre nur Parser-Last.
  { ignores: ['dist', 'node_modules', '**/*.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Architecture rule: the game core is pure TypeScript. It must stay
    // runnable outside the browser (tests today, server validation later),
    // so it may never import UI, rendering, or DOM code.
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*'], message: 'src/game ist UI-frei (Architekturregel §12).' },
            { group: ['pixi.js', 'pixi.js/*'], message: 'src/game ist Rendering-frei (Architekturregel §12).' },
            { group: ['**/components/**', '**/renderer/**', '**/state/**'], message: 'src/game importiert keine UI-Schichten (Architekturregel §12).' },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage'],
    },
  },
  {
    // The storage adapters are the one deliberate exception for localStorage.
    files: ['src/game/storage/**/*.ts'],
    rules: { 'no-restricted-globals': 'off' },
  },
);
