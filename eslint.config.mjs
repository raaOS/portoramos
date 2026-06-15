import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'public/**',
      'dist/**',
      '*.json',
      '*.mjs',
      'debug-eslint.mjs',
      'lint_output.txt',
      'lint_output_utf8.txt',
    ],
  },
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
