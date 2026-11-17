import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // Use esbuild's automatic JSX runtime so test files need no React import
  // and we avoid the vite/rolldown plugin type clash in this repo.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
