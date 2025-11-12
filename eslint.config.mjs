import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend Next.js ESLint + TypeScript presets
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // ✅ Add your custom rule overrides here
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // disable globally
    },
  },
];

export default eslintConfig;
