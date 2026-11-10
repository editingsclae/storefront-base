import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/app/account/**/*.{ts,tsx}",
      "src/app/checkout/**/*.{ts,tsx}",
      "src/app/cart/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/medusa",
              message:
                "Components and client pages must not import from '@/lib/medusa' directly. Use '@/logic' instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
