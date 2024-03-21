import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineFlatConfig } from '@antfu/eslint-define-config';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  defineFlatConfig({
    languageOptions: {
      globals: globals.node,
    },
  }),
];
