/**
 * Custom Anomaly Rules Engine tests.
 *
 * Tests the rule evaluation engine independently of the edge proxy.
 * The engine is deterministic: given the same rules and context, it always
 * produces the same result.
 */

import { describe, it, expect } from "vitest";
import { evaluateRules, parseRulesFromJson, type TenantRule, type RequestContext } from "../src/rules";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    model: "gpt-5.5",
    provider: "openai",
    team: null,
    project: null,
    prompt_tokens: 1000,
    completion_tokens: 500,
    hour_utc: 14,
    day_of_week: 3,
    ...overrides,
  };
}

function makeRule(overrides: Partial<TenantRule> = {}): TenantRule {
  return {
    id: 1,
    name: "test-rule",
    enabled: true,
    priority: 100,
    condition: {},
    action: "alert",
    action_config: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test: valid rule parsing
// ---------------------------------------------------------------------------

describe("Rule parsing", () => {
  it("parses valid rule array from JSON", () => {
    const input = [
      { id: 1, name: "rule-1", enabled: true, priority: 100, condition: { model: "gpt-5.5" }, action: "alert", action_config: { message: "test" } },
      { id: 2, name: "rule-2", enabled: false, priority: 50, condition: { team: "backend" }, action: "block", action_config: {} },
    ];
    const rules = parseRulesFromJson(input);
    expect(rules).toHaveLength(2);
    expect(rules[0].name).toBe("rule-1");
    expect(rules[1].enabled).toBe(false);
  });

  it("sorts rules by priority descending", () => {
    const input = [
      { id: 1, name: "low", priority: 10, condition: {}, action: "alert" },
      { id: 2, name: "high", priority: 200, condition: {}, action: "block" },
      { id: 3, name: "mid", priority: 100, condition: {}, action: "tag" },
    ];
    const rules = parseRulesFromJson(input);
    expect(rules[0].name).toBe("high");
    expect(rules[1].name).toBe("mid");
    expect(rules[2].name).toBe("low");
  });

  it("filters out invalid entries", () => {
    const input = [
      { id: 1, name: "valid", condition: {}, action: "alert" },
      "not an object",
      { id: 2 },
      null,
      { id: 3, name: "bad-action", condition: {}, action: "invalid" },
    ];
    const rules = parseRulesFromJson(input);
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe("valid");
  });

  it("handles empty and non-array input", () => {
    expect(parseRulesFromJson([])).toHaveLength(0);
    expect(parseRulesFromJson(null)).toHaveLength(0);
    expect(parseRulesFromJson("string")).toHaveLength(0);
    expect(parseRulesFromJson(42)).toHaveLength(0);
  });

  it("applies defaults for missing fields", () => {
    const input = [{ name: "minimal" }];
    const rules = parseRulesFromJson(input);
    expect(rules[0].enabled).toBe(true);
    expect(rules[0].priority).toBe(100);
    expect(rules[0].action).toBe("alert");
    expect(rules[0].action_config).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Test: invalid rule parsing
// ---------------------------------------------------------------------------

describe("Invalid rule parsing", () => {
  it("skips rules without name", () => {
    const input = [{ id: 1, condition: {}, action: "alert" }];
    expect(parseRulesFromJson(input)).toHaveLength(0);
  });

  it("skips rules with invalid action", () => {
    const input = [{ name: "bad", condition: {}, action: "destroy" }];
    expect(parseRulesFromJson(input)).toHaveLength(0);
  });

  it("handles malformed condition gracefully", () => {
    const input = [{ name: "ok", condition: "not-an-object", action: "alert" }];
    const rules = parseRulesFromJson(input);
    expect(rules).toHaveLength(1);
    expect(rules[0].condition).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Test: allow rule
// ---------------------------------------------------------------------------

describe("Allow rule", () => {
  it("allows request matching an allow rule", () => {
    const rules = [makeRule({ action: "allow", condition: { model: "gpt-5.5" } })];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("allow");
  });

  it("does not match allow rule for non-matching request", () => {
    const rules = [makeRule({ action: "allow", condition: { model: "claude-sonnet-4.6" } })];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test: block rule
// ---------------------------------------------------------------------------

describe("Block rule", () => {
  it("blocks request matching a block rule", () => {
    const rules = [makeRule({ action: "block", condition: { model_pattern: "gpt-5.4-mini" }, action_config: { message: "Not allowed" } })];
    const ctx = makeContext({ model: "gpt-5.4-mini" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("block");
    expect(result.message).toBe("Not allowed");
  });

  it("blocks by team", () => {
    const rules = [makeRule({ action: "block", condition: { team: "payments-eng" } })];
    const ctx = makeContext({ team: "payments-eng" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("block");
  });

  it("does not block non-matching team", () => {
    const rules = [makeRule({ action: "block", condition: { team: "payments-eng" } })];
    const ctx = makeContext({ team: "backend" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test: threshold-based rules
// ---------------------------------------------------------------------------

describe("Threshold-based rules", () => {
  it("triggers when prompt tokens exceed minimum", () => {
    const rules = [makeRule({ action: "alert", condition: { prompt_tokens_min: 50000 }, action_config: { message: "High token usage" } })];
    const ctx = makeContext({ prompt_tokens: 60000 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("alert");
  });

  it("does not trigger when below threshold", () => {
    const rules = [makeRule({ action: "alert", condition: { prompt_tokens_min: 50000 } })];
    const ctx = makeContext({ prompt_tokens: 10000 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });

  it("triggers when total tokens within range", () => {
    const rules = [makeRule({ action: "tag", condition: { total_tokens_min: 1000, total_tokens_max: 5000 }, action_config: { tag: "mid_range" } })];
    const ctx = makeContext({ prompt_tokens: 800, completion_tokens: 400 }); // total = 1200
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.tag).toBe("mid_range");
  });

  it("does not trigger when total tokens outside range", () => {
    const rules = [makeRule({ action: "tag", condition: { total_tokens_min: 1000, total_tokens_max: 5000 } })];
    const ctx = makeContext({ prompt_tokens: 100, completion_tokens: 50 }); // total = 150
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });

  it("does not trigger when completion tokens exceed max", () => {
    const rules = [makeRule({ action: "alert", condition: { completion_tokens_max: 100 } })];
    const ctx = makeContext({ completion_tokens: 200 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });

  it("triggers when completion tokens within max", () => {
    const rules = [makeRule({ action: "alert", condition: { completion_tokens_max: 500 } })];
    const ctx = makeContext({ completion_tokens: 200 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test: time-based rules
// ---------------------------------------------------------------------------

describe("Time-based rules", () => {
  it("triggers during specified hour range", () => {
    const rules = [makeRule({ action: "tag", condition: { hour_min: 22, hour_max: 6 }, action_config: { tag: "after_hours" } })];
    const ctx = makeContext({ hour_utc: 23 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.tag).toBe("after_hours");
  });

  it("triggers during wrapped hour range (22-6)", () => {
    const rules = [makeRule({ action: "tag", condition: { hour_min: 22, hour_max: 6 }, action_config: { tag: "after_hours" } })];
    const ctx = makeContext({ hour_utc: 3 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });

  it("does not trigger outside hour range", () => {
    const rules = [makeRule({ action: "tag", condition: { hour_min: 22, hour_max: 6 } })];
    const ctx = makeContext({ hour_utc: 14 });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });

  it("triggers on specific day of week", () => {
    const rules = [makeRule({ action: "alert", condition: { day_of_week: [0, 6] } })]; // Weekend
    const ctx = makeContext({ day_of_week: 6 }); // Saturday
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });

  it("does not trigger on non-matching day", () => {
    const rules = [makeRule({ action: "alert", condition: { day_of_week: [0, 6] } })];
    const ctx = makeContext({ day_of_week: 3 }); // Wednesday
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test: priority and first-match semantics
// ---------------------------------------------------------------------------

describe("Priority and first-match", () => {
  it("highest priority rule wins", () => {
    const rules = [
      makeRule({ id: 1, name: "low", priority: 10, action: "allow", condition: { model: "gpt-5.5" } }),
      makeRule({ id: 2, name: "high", priority: 200, action: "block", condition: { model: "gpt-5.5" } }),
    ].sort((a, b) => b.priority - a.priority); // Pre-sort as DB would
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.rule_name).toBe("high");
    expect(result.action).toBe("block");
  });

  it("skips disabled rules", () => {
    const rules = [
      makeRule({ id: 1, name: "disabled", enabled: false, action: "block", condition: { model: "gpt-5.5" } }),
      makeRule({ id: 2, name: "enabled", action: "alert", condition: { model: "gpt-5.5" } }),
    ];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.rule_name).toBe("enabled");
  });

  it("returns no match when no rules match", () => {
    const rules = [makeRule({ condition: { model: "claude-sonnet-4.6" } })];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
    expect(result.action).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test: model pattern matching
// ---------------------------------------------------------------------------

describe("Model pattern matching", () => {
  it("matches substring pattern", () => {
    const rules = [makeRule({ action: "alert", condition: { model_pattern: "gpt-5" } })];
    const ctx = makeContext({ model: "gpt-5.4-mini" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });

  it("does not match when pattern absent", () => {
    const rules = [makeRule({ action: "alert", condition: { model_pattern: "claude" } })];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });

  it("does not match when model is null", () => {
    const rules = [makeRule({ action: "alert", condition: { model_pattern: "gpt" } })];
    const ctx = makeContext({ model: null });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test: malformed tenant config
// ---------------------------------------------------------------------------

describe("Malformed tenant config", () => {
  it("handles empty rules array", () => {
    const result = evaluateRules([], makeContext());
    expect(result.matched).toBe(false);
  });

  it("handles rules with empty conditions (matches everything)", () => {
    const rules = [makeRule({ condition: {} })];
    const ctx = makeContext();
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });

  it("handles null condition gracefully", () => {
    const rules = [makeRule({ condition: null as any })];
    const ctx = makeContext();
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test: throttle action
// ---------------------------------------------------------------------------

describe("Throttle action", () => {
  it("returns throttle action with delay_ms from config", () => {
    const rules = [makeRule({
      action: "throttle",
      condition: { model: "gpt-5.5" },
      action_config: { delay_ms: 5000, message: "Rate limited" },
    })];
    const ctx = makeContext({ model: "gpt-5.5" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("throttle");
    expect(result.delay_ms).toBe(5000);
    expect(result.message).toBe("Rate limited");
  });

  it("defaults delay_ms to 0 when not configured", () => {
    const rules = [makeRule({
      action: "throttle",
      condition: { team: "backend" },
      action_config: {},
    })];
    const ctx = makeContext({ team: "backend" });
    const result = evaluateRules(rules, ctx);
    expect(result.matched).toBe(true);
    expect(result.action).toBe("throttle");
    expect(result.delay_ms).toBe(0);
  });

  it("throttle is distinct from block", () => {
    const throttleRule = makeRule({ action: "throttle", condition: { model: "gpt-5.5" } });
    const blockRule = makeRule({ action: "block", condition: { model: "gpt-5.5" } });
    const ctx = makeContext({ model: "gpt-5.5" });

    const throttleResult = evaluateRules([throttleRule], ctx);
    const blockResult = evaluateRules([blockRule], ctx);

    expect(throttleResult.action).toBe("throttle");
    expect(blockResult.action).toBe("block");
    expect(throttleResult.action).not.toBe(blockResult.action);
  });
});
