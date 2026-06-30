import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: {
        bindings: {
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-not-real",
          OPENAI_API_KEY: "test-openai-key-not-real",
          ANTHROPIC_API_KEY: "test-anthropic-key-not-real",
          GROQ_API_KEY: "test-groq-key-not-real",
          XAI_API_KEY: "test-xai-key-not-real",
          GEMINI_API_KEY: "test-gemini-key-not-real",
          SLACK_WEBHOOK_URL: "https://hooks.slack.com/test",
          RESEND_API_KEY: "test-resend-key-not-real",
          REPORT_FROM_EMAIL: "AgentWatch <test@agentwatch.dev>",
          CORS_ALLOWED_ORIGIN: "https://agentwatch.dev"
        }
      }
    })
  ],
  test: {
    name: "proxy",
    include: ["tests/**/*.test.ts"],
    pool: "@cloudflare/vitest-pool-workers",
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
    },
  },
});
