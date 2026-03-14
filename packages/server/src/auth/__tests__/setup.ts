import { vi } from "vitest";
import bcrypt from "bcryptjs";

// Polyfill Bun.password for vitest (which runs in Node, not Bun)
vi.stubGlobal("Bun", {
  password: {
    hash: (password: string, options?: { algorithm?: string; cost?: number }) => {
      const rounds = options?.cost ?? 10;
      return bcrypt.hash(password, rounds);
    },
    verify: (password: string, hash: string) => {
      return bcrypt.compare(password, hash);
    },
  },
});
