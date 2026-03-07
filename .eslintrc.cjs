module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'server/dist', 'design-v2', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  rules: {
    'no-alert': 'error',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'object-shorthand': ['error', 'always'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react-refresh/only-export-components': [
      'error',
      {
        allowConstantExport: true,
        allowExportNames: ['useNavigate', 'useLocation', 'useParams', 'useUndo'],
      },
    ],
  },
  overrides: [
    {
      files: ['server/**/*.ts'],
      env: {
        browser: false,
        node: true,
        es2022: true,
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ],
};
