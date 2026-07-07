"""
AgentWatch Python Example — Pre-Execution Cost Estimation

This example demonstrates how to estimate the cost of an LLM request
before actually sending it through the proxy.

Useful for budgeting, user-facing cost previews, and proactive governance.

Requirements:
    pip install requests

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export AGENTWATCH_URL="http://localhost:8787"
"""

import os

import requests

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")


# Approximate pricing per 1M tokens (USD) — check provider docs for current rates.
MODEL_PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
    "claude-3-5-haiku": {"input": 0.80, "output": 4.00},
}


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Estimate the USD cost of a request based on model pricing."""
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        raise ValueError(f"Unknown model: {model}. Add pricing to MODEL_PRICING.")

    input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
    output_cost = (completion_tokens / 1_000_000) * pricing["output"]
    return input_cost + output_cost


def estimate_with_context(
    model: str,
    messages: list[dict],
    max_tokens: int = 1024,
) -> dict:
    """Estimate cost for a chat completion request."""
    # Rough token estimation: ~4 chars per token for English text
    prompt_chars = sum(len(m.get("content", "")) for m in messages)
    estimated_prompt_tokens = max(prompt_chars // 4, 1)

    cost = estimate_cost(model, estimated_prompt_tokens, max_tokens)

    return {
        "model": model,
        "estimated_prompt_tokens": estimated_prompt_tokens,
        "estimated_completion_tokens": max_tokens,
        "estimated_cost_usd": round(cost, 6),
    }


def main():
    # --- Example 1: Simple cost estimation ---
    print("--- Cost Estimation ---\n")

    models_to_check = ["gpt-4o-mini", "gpt-4o", "claude-3-5-sonnet"]
    sample_tokens = [500, 1000, 5000]

    for model in models_to_check:
        print(f"Model: {model}")
        for tokens in sample_tokens:
            cost = estimate_cost(model, tokens, tokens)
            print(f"  {tokens:>5} input + {tokens:>5} output tokens = ${cost:.6f}")
        print()

    # --- Example 2: Estimate before sending a real request ---
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain the theory of relativity in simple terms."},
    ]

    print("--- Pre-Send Cost Estimate ---\n")
    estimate = estimate_with_context(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=512,
    )
    print(f"  Model: {estimate['model']}")
    print(f"  Prompt tokens: ~{estimate['estimated_prompt_tokens']}")
    print(f"  Completion tokens: {estimate['estimated_completion_tokens']}")
    print(f"  Estimated cost: ${estimate['estimated_cost_usd']:.6f}")

    # --- Example 3: Budget check before proceeding ---
    BUDGET_LIMIT = 1.00  # $1.00 daily budget
    daily_spend = 0.85   # Simulated current spend

    remaining = BUDGET_LIMIT - daily_spend
    if estimate["estimated_cost_usd"] > remaining:
        print(f"\n⚠ Blocked: Would exceed daily budget (${remaining:.2f} remaining)")
        print("  Consider using a cheaper model or reducing max_tokens.")
    else:
        print(f"\n✓ Within budget (${remaining:.2f} remaining)")
        print("  Safe to proceed with the request.")


if __name__ == "__main__":
    main()
