module.exports = {
  root: true,
  extends: '@react-native',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
        'react-native/no-inline-styles': 'warn',
        'react/react-in-jsx-scope': 'off',
        // Unused vars are advisory (prefix with _ to silence intentionally).
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true},
        ],
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
  ],
  rules: {
    // Formatting is handled by `npm run format` (Prettier CLI); the ESLint
    // prettier plugin isn't part of the dependency set, so disable the rule
    // to avoid "rule not found" noise.
    'prettier/prettier': 'off',
  },
};
