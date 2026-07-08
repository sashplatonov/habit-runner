const baseRules = {
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
};

const typescriptRules = {
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
};

module.exports = {
  baseRules,
  typescriptRules,
};
