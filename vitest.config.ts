import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup/database.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": "/Users/drewritter/projects/bignight.party/src",
    },
  },
});
