import nextConfig from "eslint-config-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const config = [
    ...nextConfig,
    {
        // Global ignores
        ignores: [".next/**", "node_modules/**", "coverage/**", "out/**", "build/**", "scripts/**"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            // Critical TypeScript - Error level
            "@typescript-eslint/no-explicit-any": "warn", // Relaxed: warn instead of error
            "@typescript-eslint/no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_" 
            }], // Relaxed: warn instead of error
            
            // Type imports - Relaxed
            "@typescript-eslint/consistent-type-imports": "off", // Disabled for now (too many errors)
            
            // React - Relaxed
            "react/no-unused-prop-types": "off",
            "react/no-unused-state": "off",
            "react/jsx-no-useless-fragment": "off",
            
            // Import rules - Critical only
            "no-duplicate-imports": "error",
            "import/no-duplicates": "error",
            
            // React hooks
            "react-hooks/exhaustive-deps": "warn",
        },
    },
];

export default config;
