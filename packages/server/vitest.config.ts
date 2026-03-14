import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/auth/__tests__/setup.ts"],
  },
});
