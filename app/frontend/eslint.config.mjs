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
  // A backend call whose answer nobody waits for can fail without the screen
  // knowing, so it must be awaited or handled.
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    },
  },
  // One look on every screen (ADR-0004): colors come from the theme in
  // globals.css and components from src/components/, never from a page.
  // The last selector keeps a refusal visible, in the tests as well.
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.ts"],
    ignores: ["src/app/globals.css"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]/], TemplateElement[value.raw=/\\[#[0-9a-fA-F]{3,8}\\]/]",
          message:
            "No hard-coded colors in a page: use a theme color (bg-primary, text-muted, ...) from globals.css. See /styleguide.",
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "No inline styles: use Tailwind classes and the theme from globals.css. See /styleguide.",
        },
        {
          selector:
            "CatchClause > BlockStatement[body.length=0], CallExpression[callee.property.name='catch'] > :function[body.type='BlockStatement'][body.body.length=0], CallExpression[callee.property.name='catch'] > ArrowFunctionExpression[body.type='Literal'][body.raw='null'], CallExpression[callee.property.name='catch'] > ArrowFunctionExpression > Identifier.body[name='undefined']",
          message:
            "Do not swallow an error: show the user what went wrong, or let it fail. A hidden backend refusal is how a screen says 'saved' when nothing was.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@mui/*",
                "antd",
                "antd/*",
                "@chakra-ui/*",
                "react-bootstrap",
                "bootstrap",
                "@radix-ui/*",
                "@headlessui/*",
                "flowbite*",
                "@mantine/*",
                "styled-components",
                "@emotion/*",
              ],
              message:
                "One component library: daisyUI through Tailwind classes, and the components in src/components/ (ADR-0004).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
