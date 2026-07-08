const tseslint = require('@typescript-eslint/eslint-plugin');
const { baseRules, typescriptRules } = require('../../eslint-rules.cjs');

module.exports = [
  ...tseslint.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...baseRules,
      ...typescriptRules,
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
