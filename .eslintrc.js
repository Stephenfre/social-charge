module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "airbnb-typescript/base",
    "prettier",
    "plugin:import/typescript",
  ],
  ignorePatterns: [
    "dist",
    ".eslintrc.cjs",
    "swagger",
    "generated-client",
    "nba-openapi",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint", "prettier", "import"],
  rules: {
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/vite.config.ts",
          "**/*.stories.{ts,tsx}",
          "**/*.test.{ts,tsx}",
          "./scripts/**/*.ts",
          "./test/**/*.{ts,tsx}",
          "./plugins/**/*.{ts,tsx}",
          "./packages/@suns/design-system/src/theme.ts",
        ],
      },
    ],
    "@typescript-eslint/lines-between-class-members": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        "": "never",
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "no-console": "error",
  },
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["./**/*.js"],
    },
    {
      files: ["./scripts/**/*"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};
