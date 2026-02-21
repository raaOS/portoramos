import nextConfig from "eslint-config-next";

const config = [
    ...nextConfig,
    {
        // Global ignores
        ignores: [".next/**", "node_modules/**", "coverage/**", "out/**", "build/**"],
    },
];

export default config;
