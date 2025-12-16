import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

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
