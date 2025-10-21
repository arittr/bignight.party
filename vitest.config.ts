import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      tests: path.resolve(__dirname, "./tests"),
    },
  },
  test: {
    environment: "happy-dom",
    fileParallelism: false,
    globals: true,
    setupFiles: ["./tests/setup/database.ts", "./tests/setup/test-setup.ts"],
  },
});
