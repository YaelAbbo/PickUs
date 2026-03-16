import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig(
  { ignores: ['dist', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, eslintPluginPrettierRecommended],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      'prettier/prettier': 'error',
      'linebreak-style': ['error', 'unix'],
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off', // React Native uses require() for images
      'no-undef': 'off', // TypeScript handles this via type checking
    },
  },
);
