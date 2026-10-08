import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit and component tests: files named *.test.ts(x) next to the code.
// End-to-end tests live in e2e/ and run with Playwright, not here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
