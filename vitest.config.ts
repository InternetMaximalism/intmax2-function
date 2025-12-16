import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/dist/**"],
  },
  resolve: {
    alias: {
      "@intmax2-function/shared": path.resolve(process.cwd(), "./packages/shared/src"),
    },
  },
});
