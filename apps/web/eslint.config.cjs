const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const svelte = require('eslint-plugin-svelte');
const { baseRules, typescriptRules } = require('./eslint-rules.cjs');

const browserJavaScriptFiles = ['**/*.{js,jsx}'];
const browserTypeScriptFiles = ['**/*.{ts,tsx}'];
const svelteFiles = ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'];
const svelteRecommended = Array.isArray(svelte.configs['flat/recommended'])
  ? svelte.configs['flat/recommended']
  : [svelte.configs['flat/recommended']];

module.exports = [
  {
    ignores: ['dist/', 'build/', '.svelte-kit/', 'node_modules/', 'scripts/'],
  },
  {
    ...js.configs.recommended,
    files: browserJavaScriptFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...baseRules,
    },
  },
  ...tseslint.configs['flat/recommended'],
  ...svelteRecommended,
  {
    files: browserTypeScriptFiles,
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
    },
  },
  {
    files: svelteFiles,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      'no-alert': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'svelte/no-at-html-tags': 'off',
    },
  },
];
