import nextConfig from "eslint-config-next";

export default [
    ...nextConfig,
    {
        // Global ignores
        ignores: [".next/**", "node_modules/**", "coverage/**", "out/**", "build/**"],
    },
];
