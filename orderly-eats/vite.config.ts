import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    // Resolve TS path aliases like `@/` -> `src/`
    tsconfigPaths(),

    // TanStack Start plugin with Vercel SSR preset for proper server output
    tanstackStart({
      server: {
        preset: "vercel",
      },
    }),
  ],
});
