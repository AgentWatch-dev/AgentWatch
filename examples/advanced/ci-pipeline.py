"""
AgentWatch Python Example — CI/CD Budget Enforcement

This example demonstrates how to enforce budget limits in CI/CD pipelines
where AI agents may be used for code review, test generation, or documentation.

Use AgentWatch as a proxy to prevent runaway AI costs from breaking your
pipeline budget.

Requirements:
    pip install openai requests

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
"""

import os
import sys

from openai import OpenAI

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
OPENAI_KEY = os.environ.get("OPENAI_KEY", "sk-proj-your-key")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")

# CI/CD budget configuration
CI_BUDGET_USD = float(os.environ.get("CI_BUDGET_USD", "5.00"))
MAX_TOKENS_PER_CALL = 4096


def ci_chat(prompt: str, model: str = "gpt-4o-mini") -> str:
    """Send a chat request with CI-specific budget controls."""
    client = OpenAI(
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
    )

    # Use a unique session ID per CI run for isolation
    run_id = os.environ.get("GITHUB_RUN_ID", "local-run")
    job_name = os.environ.get("GITHUB_JOB", "ai-review")

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_TOKENS_PER_CALL,
        extra_headers={
            "x-agentwatch-session-id": f"ci-{job_name}-{run_id}",
            "x-agentwatch-budget-usd": str(CI_BUDGET_USD),
        },
    )

    return response.choices[0].message.content or ""


def main():
    print(f"=== CI/CD AI Budget Enforcement ===")
    print(f"Budget: ${CI_BUDGET_USD:.2f} per run")
    print(f"Max tokens per call: {MAX_TOKENS_PER_CALL}\n")

    # --- Code review example ---
    print("--- Code Review ---")
    sample_diff = """
+ def calculate_total(items):
+     total = 0
+     for item in items:
+         total += item['price'] * item['quantity']
+     return total
    """

    try:
        review = ci_chat(
            f"Review this code diff for bugs or improvements:\n{sample_diff}"
        )
        print(f"Review: {review}\n")
    except Exception as e:
        print(f"BLOCKED (budget exceeded): {e}")
        sys.exit(1)

    # --- Test generation example ---
    print("--- Test Generation ---")
    try:
        tests = ci_chat(
            "Generate 3 pytest test cases for a function that calculates the "
            "average of a list of numbers. Handle edge cases."
        )
        print(f"Generated tests:\n{tests}\n")
    except Exception as e:
        print(f"BLOCKED (budget exceeded): {e}")
        sys.exit(1)

    # --- Documentation example ---
    print("--- Documentation ---")
    try:
        docs = ci_chat(
            "Write a one-paragraph API documentation for a function called "
            "'process_payment(amount, currency, customer_id)' that processes "
            "a payment and returns a transaction ID."
        )
        print(f"Documentation:\n{docs}\n")
    except Exception as e:
        print(f"BLOCKED (budget exceeded): {e}")
        sys.exit(1)

    print("=== All CI tasks completed within budget ===")


if __name__ == "__main__":
    main()
