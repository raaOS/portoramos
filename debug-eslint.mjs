
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const result = compat.config({
    extends: [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended"
    ]
});

console.log(JSON.stringify(result, null, 2));
