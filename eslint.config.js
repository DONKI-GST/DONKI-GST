import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
  },
];
