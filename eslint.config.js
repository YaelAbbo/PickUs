import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  { ignores: ['dist', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, eslintPluginPrettierRecommended],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: { ecmaVersion: 2020 },
    rules: { 'prettier/prettier': 'error', 'linebreak-style': ['error', 'unix'] },
  },
);
