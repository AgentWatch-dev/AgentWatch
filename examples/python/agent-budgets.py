"""
AgentWatch Python Example — Per-Agent Budgets

This example demonstrates how to set individual budgets for different agents
running in the same session or across sessions.

Each agent gets its own session ID, allowing independent budget tracking
and enforcement.

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


def run_agent(agent_name: str, session_id: str, budget_usd: float, prompt: str):
    """Run an agent with its own budget cap."""
    client = OpenAI(
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
    )

    print(f"\n--- Agent: {agent_name} (budget: ${budget_usd:.2f}) ---")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "x-agentwatch-session-id": session_id,
                "x-agentwatch-budget-usd": str(budget_usd),
            },
        )
        print(f"  {response.choices[0].message.content}")
    except Exception as e:
        print(f"  Blocked: {e}")


def main():
    # --- Scenario: Multi-agent system ---
    # Each agent has a unique session ID and its own budget cap.

    # Agent 1: Research assistant — tight budget
    run_agent(
        agent_name="research-agent",
        session_id="agent-research-001",
        budget_usd=0.50,
        prompt="What are the key findings in quantum computing 2025?",
    )

    # Agent 2: Code writer — higher budget
    run_agent(
        agent_name="code-agent",
        session_id="agent-code-002",
        budget_usd=2.00,
        prompt="Write a Python function to compute Fibonacci numbers.",
    )

    # Agent 3: Reviewer — small budget for validation
    run_agent(
        agent_name="review-agent",
        session_id="agent-review-003",
        budget_usd=0.25,
        prompt="Review this code for bugs: def fib(n): return n if n<2 else fib(n-1)+fib(n-2)",
    )

    # --- Alternative: shared session with sub-budgets ---
    # If you want agents to share context but have individual budgets,
    # use a shared prefix in the session ID:
    SHARED_PREFIX = "pipeline-v1"
    run_agent(
        agent_name="step-1-summarize",
        session_id=f"{SHARED_PREFIX}-summarize",
        budget_usd=0.30,
        prompt="Summarize this article in 3 bullet points.",
    )
    run_agent(
        agent_name="step-2-translate",
        session_id=f"{SHARED_PREFIX}-translate",
        budget_usd=0.15,
        prompt="Translate the summary to Spanish.",
    )


if __name__ == "__main__":
    main()
