export type Provider = "openai" | "anthropic" | "groq" | "xai" | "gemini" | "azure" | "bedrock" | "xiaomi" | "mistral" | "cohere";

export interface Env {
  SESSION_TRACKER: DurableObjectNamespace<import("./session_do").SessionTracker>;
  TENANT_BALANCE: DurableObjectNamespace<import("./balance_do").TenantBalance>;
  BUDGET_TRACKER: DurableObjectNamespace<import("./budget_do").BudgetTracker>;
  RATE_LIMITER: { limit(args: { key: string }): Promise<{ success: boolean }> }; // Cloudflare Native RateLimiter binding type
  KV: KVNamespace;
  ASSETS: { fetch(url: URL | string | Request, init?: RequestInit): Promise<Response> };
  OPENAI_BASE_URL?: string;  // Optional: override OpenAI API base URL
  ANTHROPIC_BASE_URL?: string;  // Optional: override Anthropic API base URL
  ANTHROPIC_VERSION?: string;
  AZURE_OPENAI_API_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  TENANT_TOKEN_MAP: string;
  LOG_WRITE_TIMEOUT_MS?: string;
  RESEND_API_KEY?: string;
  REPORT_FROM_EMAIL?: string;
  REPORT_RECIPIENT_MAP?: string;
  REPORT_DEFAULT_RECIPIENT?: string;
  CORS_ALLOWED_ORIGIN?: string;
  SLACK_WEBHOOK_URL?: string;
  TELEMETRY_QUEUE?: Queue<any>;
  ADMIN_SECRET?: string;
  CONTACT_EMAIL?: string;
  SSO_ENABLED?: string;
  SITE_URL?: string;
}
