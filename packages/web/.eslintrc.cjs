const sharedConfig = require('../shared/.eslintrc.cjs');

const sharedExtends = Array.isArray(sharedConfig.extends)
  ? [...sharedConfig.extends]
  : sharedConfig.extends
  ? [sharedConfig.extends]
  : [];
const sharedPlugins = Array.isArray(sharedConfig.plugins) ? [...sharedConfig.plugins] : [];
const sharedOverrides = Array.isArray(sharedConfig.overrides) ? [...sharedConfig.overrides] : [];

module.exports = {
  ...sharedConfig,
  env: { ...sharedConfig.env, browser: true },
  extends: [...sharedExtends, 'plugin:react-hooks/recommended'],
  plugins: [...sharedPlugins, 'react-refresh'],
  rules: {
    ...sharedConfig.rules,
    'no-alert': 'error',
    'no-console': 'error',
    'react-refresh/only-export-components': [
      'error',
      {
        allowConstantExport: true,
        allowExportNames: ['useNavigate', 'useLocation', 'useParams', 'useUndo']
      }
    ]
  },
  overrides: [
    ...sharedOverrides,
    {
      files: ['server/**/*.ts'],
      env: {
        browser: false,
        node: true,
        es2022: true
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off'
      }
    }
  ]
};
