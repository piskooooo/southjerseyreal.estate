import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      clearMocks: true,
      environment: "node",
      env: {
        VITE_GA_MEASUREMENT_ID: "G-TEST123",
        VITE_SUPABASE_URL: "https://test-project.supabase.co",
        VITE_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      },
      include: [
        "src/**/*.test.{ts,tsx}",
        "supabase/functions/**/*.test.ts",
      ],
      restoreMocks: true,
    },
  }),
);
