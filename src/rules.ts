// AgentWatch Custom Anomaly Rules Engine
// Evaluates tenant-defined policies against request metadata at the edge.

export interface RuleCondition {
  model?: string;
  model_pattern?: string;
  provider?: string;
  team?: string;
  project?: string;
  prompt_tokens_min?: number;
  prompt_tokens_max?: number;
  completion_tokens_min?: number;
  completion_tokens_max?: number;
  total_tokens_min?: number;
  total_tokens_max?: number;
  hour_min?: number;
  hour_max?: number;
  day_of_week?: number[];
}

export interface RuleActionConfig {
  message?: string;
  tag?: string;
  delay_ms?: number;
  webhook_url?: string;
}

export interface TenantRule {
  id: number;
  name: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  action: "allow" | "block" | "throttle" | "alert" | "tag";
  action_config: RuleActionConfig;
}

export interface RequestContext {
  model: string | null;
  provider: string;
  team: string | null;
  project: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  hour_utc: number;
  day_of_week: number;
}

export interface RuleEvaluationResult {
  matched: boolean;
  action: TenantRule["action"] | null;
  rule_name: string | null;
  rule_id: number | null;
  message: string | null;
  tag: string | null;
  delay_ms: number;
}

function matchesCondition(condition: RuleCondition, ctx: RequestContext): boolean {
  if (!condition || typeof condition !== "object") return true; // Empty/null condition matches everything
  if (condition.model && ctx.model !== condition.model) return false;

  if (condition.model_pattern && ctx.model) {
    if (!ctx.model.includes(condition.model_pattern)) return false;
  } else if (condition.model_pattern && !ctx.model) {
    return false;
  }

  if (condition.provider && ctx.provider !== condition.provider) return false;
  if (condition.team && ctx.team !== condition.team) return false;
  if (condition.project && ctx.project !== condition.project) return false;

  const totalTokens = ctx.prompt_tokens + ctx.completion_tokens;

  if (condition.prompt_tokens_min != null && ctx.prompt_tokens < condition.prompt_tokens_min) return false;
  if (condition.prompt_tokens_max != null && ctx.prompt_tokens > condition.prompt_tokens_max) return false;
  if (condition.completion_tokens_min != null && ctx.completion_tokens < condition.completion_tokens_min) return false;
  if (condition.completion_tokens_max != null && ctx.completion_tokens > condition.completion_tokens_max) return false;
  if (condition.total_tokens_min != null && totalTokens < condition.total_tokens_min) return false;
  if (condition.total_tokens_max != null && totalTokens > condition.total_tokens_max) return false;

  if (condition.hour_min != null && condition.hour_max != null) {
    if (condition.hour_min <= condition.hour_max) {
      if (ctx.hour_utc < condition.hour_min || ctx.hour_utc > condition.hour_max) return false;
    } else {
      // Wraps around midnight (e.g. 22 to 6)
      if (ctx.hour_utc < condition.hour_min && ctx.hour_utc > condition.hour_max) return false;
    }
  }

  if (condition.day_of_week && condition.day_of_week.length > 0) {
    if (!condition.day_of_week.includes(ctx.day_of_week)) return false;
  }

  return true;
}

export function evaluateRules(rules: TenantRule[], ctx: RequestContext): RuleEvaluationResult {
  // Rules are pre-sorted by priority DESC from the DB query.
  // First matching rule wins.
  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (matchesCondition(rule.condition, ctx)) {
      return {
        matched: true,
        action: rule.action,
        rule_name: rule.name,
        rule_id: rule.id,
        message: rule.action_config.message || null,
        tag: rule.action_config.tag || null,
        delay_ms: rule.action_config.delay_ms || 0,
      };
    }
  }

  return {
    matched: false,
    action: null,
    rule_name: null,
    rule_id: null,
    message: null,
    tag: null,
    delay_ms: 0,
  };
}

export function parseRulesFromJson(json: unknown): TenantRule[] {
  if (!Array.isArray(json)) return [];
  const rules: TenantRule[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.name !== "string") continue;
    if (r.action && !["allow", "block", "throttle", "alert", "tag"].includes(r.action as string)) continue;
    rules.push({
      id: typeof r.id === "number" ? r.id : 0,
      name: r.name as string,
      enabled: r.enabled !== false,
      priority: typeof r.priority === "number" ? r.priority : 100,
      condition: (r.condition && typeof r.condition === "object") ? r.condition as RuleCondition : {},
      action: (r.action as TenantRule["action"]) || "alert",
      action_config: (r.action_config && typeof r.action_config === "object") ? r.action_config as RuleActionConfig : {},
    });
  }
  return rules.sort((a, b) => b.priority - a.priority);
}
