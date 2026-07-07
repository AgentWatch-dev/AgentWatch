"""
AgentWatch Python Example — Team-Level Budgets

This example demonstrates how to set and enforce team-level budget caps.
Team budgets limit total spend across all models and agents for a team.

The proxy automatically maps usage to a team based on the developer key
used — no extra headers are required from the application code.

Requirements:
    pip install openai

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
"""

import os

from openai import OpenAI

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
OPENAI_KEY = os.environ.get("OPENAI_KEY", "sk-proj-your-key")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")


def main():
    # Team budgets are enforced at the key level.
    # Generate a team-specific key in the AgentWatch Dashboard:
    #   Dashboard -> Teams & Budgets -> Access Control -> Generate Developer Key
    #
    # The proxy automatically tracks usage for this key against the
    # team's monthly budget cap.

    client = OpenAI(
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
        # No team headers needed — the proxy knows the team from the key
    )

    # --- Make a request with a session-level budget ---
    # Session budgets stack with team budgets.
    # The more restrictive limit applies.
    print("Sending request with session budget of $0.10...")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Summarize quantum computing."}],
            extra_headers={
                "x-agentwatch-session-id": "team-budget-demo",
                "x-agentwatch-budget-usd": "0.10",
            },
        )
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Blocked (budget exceeded?): {e}")

    # --- Budget Hierarchy ---
    # 1. Session budget is checked first (per-request)
    # 2. If session passes, team budget is checked (monthly cap)
    # 3. The more restrictive limit wins
    #
    # Example: Session budget = $2.00, Team budget = $500/month
    #   -> Blocks at $2.00 even if team has $500 left
    #
    # Example: Session budget = $10.00, Team has $0.50 remaining
    #   -> Blocks at $0.50 (team budget exhausted)

    print("\n--- Budget Hierarchy ---")
    print("1. Session budget checked first")
    print("2. Team budget checked second")
    print("3. More restrictive limit applies")


if __name__ == "__main__":
    main()
