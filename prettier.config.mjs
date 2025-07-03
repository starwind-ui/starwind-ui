/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  tailwindFunctions: ["tv"],
  overrides: [
    {
      files: [".*", "*.md", "*.toml", "*.yml"],
      options: {
        useTabs: false,
      },
    },
    {
      files: ["**/*.astro"],
      options: {
        parser: "astro",
      },
    },
    {
      files: ["**/*.jsonc"],
      options: {
        parser: "json",
      },
    },
  ],
};
