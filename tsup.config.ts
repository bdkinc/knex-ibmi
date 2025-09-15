import { defineConfig } from "tsup";

export default defineConfig([
  // Main library build
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true, // Re-enabled after fixing TypeScript errors
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["knex", "odbc"],
    outExtension: ({ format }) => ({
      js: format === "esm" ? ".mjs" : ".js",
    }),
    esbuildOptions: (options) => {
      // Fix module resolution for Knex internal imports in ESM
      options.banner = {
        js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
        `.trim(),
      };
    },
  },
  // CLI build
  {
    entry: ["src/cli.ts"],
    format: ["cjs"],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    external: ["knex", "odbc"],
    outExtension: () => ({ js: ".cjs" }),
    esbuildOptions: (options) => {
      options.banner = {
        js: '"use strict";',
      };
    },
  },
]);
