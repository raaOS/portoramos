export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "scripts/**",
      "public/**"
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
    },
  },
];
