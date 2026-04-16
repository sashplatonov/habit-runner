const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const svelte = require('eslint-plugin-svelte');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const svelteRecommended = Array.isArray(svelte.configs.recommended)
  ? svelte.configs.recommended
  : [svelte.configs.recommended];

const scriptConfigs = compat
  .config({
    env: { browser: true, es2022: true },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-alert': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'object-shorthand': ['error', 'always'],
      complexity: ['error', 12],
      'max-params': ['error', 5],
      'max-lines-per-function': [
        'error',
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': [
        'error',
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  })
  .map((config) => ({
    ...config,
    files: ['**/*.{js,jsx,ts,tsx}'],
  }));

module.exports = [
  {
    ignores: ['dist/', 'build/', '.svelte-kit/', 'node_modules/', 'scripts/'],
  },
  ...scriptConfigs,
  ...svelteRecommended,
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: require('@typescript-eslint/parser'),
        projectService: true,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      'no-alert': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
    },
  },
];
