import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/app/game/persistence.ts",
        "src/app/game/sessionLock.ts",
        "src/app/context/ProgressContext.tsx",
        "src/app/context/WindowManagerContext.tsx",
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        statements: 40,
        branches: 35,
      },
    },
  },
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
