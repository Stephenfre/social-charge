/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: false, // RN is not a browser
    node: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'import',
    'unused-imports',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'plugin:import/typescript',
    'prettier', // keep last
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json'],
      },
    },
  },
  ignorePatterns: ['dist', 'build', 'android', 'ios', '.expo', '.expo-shared', '.eslintrc.cjs'],
  rules: {
    // ---- Your asks ----
    // disallow console.log, allow warn/error (common in RN)
    'no-console': ['error', { allow: ['warn', 'error'] }],

    // remove unused imports automatically on --fix, fail on leftover
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    // ---- RN/TS niceties ----
    'react-native/no-inline-styles': 'off', // enable if you want stricter styles
    'react-native/no-raw-text': 'off', // disable for i18n-heavy apps
    'react/react-in-jsx-scope': 'off', // RN/React 17+
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // import hygiene
    'import/extensions': [
      'error',
      'ignorePackages',
      { '': 'never', js: 'never', jsx: 'never', ts: 'never', tsx: 'never' },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          // Expo / Metro / tooling files
          'app.config.{ts,js}',
          'metro.config.{ts,js}',
          'babel.config.{ts,js}',
          'jest.config.{ts,js}',
          '**/*.test.{ts,tsx,js,jsx}',
          '**/*.spec.{ts,tsx,js,jsx}',
          'e2e/**/*.{ts,tsx,js,jsx}',
          'scripts/**/*.{ts,tsx,js,jsx}',
        ],
      },
    ],

    // prettier as an ESLint rule (optional; if you run Prettier separately you can omit)
    'prettier/prettier': 'warn',
  },

  overrides: [
    // Plain JS files (disable TS type-aware rules)
    {
      files: ['./**/*.js'],
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
    },
    // Scripts: allow console
    {
      files: ['scripts/**/*.{ts,tsx,js,jsx}'],
      rules: { 'no-console': 'off' },
    },
  ],
};
