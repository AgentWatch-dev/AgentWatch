"""
AgentWatch Python Example — Custom Anomaly Rules

This example demonstrates how to create, list, and manage custom anomaly
detection rules via the AgentWatch Rules API.

Custom rules let you define conditions (token thresholds, model filters,
time-of-day restrictions) and actions (block, throttle, alert, tag).

Requirements:
    pip install requests

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export ADMIN_SECRET="your_admin_secret"
    export AGENTWATCH_URL="http://localhost:8787"
"""

import os
import sys

import requests

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "your_admin_secret")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")


def headers():
    return {
        "Authorization": f"Bearer {AGENTWATCH_KEY}",
        "Content-Type": "application/json",
    }


def create_rule(rule: dict) -> dict:
    """Create a new anomaly detection rule."""
    resp = requests.post(
        f"{AGENTWATCH_URL}/v1/rules",
        headers=headers(),
        json=rule,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def list_rules() -> list:
    """List all anomaly detection rules."""
    resp = requests.get(f"{AGENTWATCH_URL}/v1/rules", headers=headers(), timeout=10)
    resp.raise_for_status()
    return resp.json()


def delete_rule(rule_id: int) -> bool:
    """Delete a rule by ID."""
    resp = requests.delete(
        f"{AGENTWATCH_URL}/v1/rules/{rule_id}",
        headers=headers(),
        timeout=10,
    )
    return resp.status_code == 204


def main():
    # --- Example 1: Block requests with excessive prompt tokens ---
    print("Creating rule: block-excessive-prompt-tokens")
    rule1 = create_rule(
        {
            "name": "block-excessive-prompt-tokens",
            "enabled": True,
            "priority": 250,
            "condition": {"prompt_tokens_min": 100000},
            "action": "block",
            "action_config": {
                "message": "Request blocked: prompt exceeds 100K tokens.",
            },
        }
    )
    print(f"  Created: {rule1}")
    print()

    # --- Example 2: Alert on expensive model usage ---
    print("Creating rule: alert-on-expensive-model")
    rule2 = create_rule(
        {
            "name": "alert-on-expensive-model",
            "enabled": True,
            "priority": 200,
            "condition": {"model": "gpt-4o"},
            "action": "alert",
            "action_config": {
                "message": "High-cost model usage detected. Review spend.",
                "tag": "cost-alert",
                "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            },
        }
    )
    print(f"  Created: {rule2}")
    print()

    # --- Example 3: Throttle during off-hours ---
    print("Creating rule: throttle-off-hours")
    rule3 = create_rule(
        {
            "name": "throttle-off-hours",
            "enabled": True,
            "priority": 150,
            "condition": {"hour_min": 22, "hour_max": 6},
            "action": "throttle",
            "action_config": {
                "delay_ms": 5000,
                "message": "Rate limited during off-hours (10 PM - 6 AM UTC).",
            },
        }
    )
    print(f"  Created: {rule3}")
    print()

    # --- Example 4: Tag requests for specific teams ---
    print("Creating rule: tag-ml-team-requests")
    rule4 = create_rule(
        {
            "name": "tag-ml-team-requests",
            "enabled": True,
            "priority": 100,
            "condition": {"team": "ml-engineering"},
            "action": "tag",
            "action_config": {"tag": "ml-team"},
        }
    )
    print(f"  Created: {rule4}")
    print()

    # --- List all rules ---
    print("--- All Rules ---")
    rules = list_rules()
    for rule in rules:
        action = rule.get("action", "unknown")
        name = rule.get("name", "unnamed")
        print(f"  [{rule.get('id')}] {name} -> {action}")
    print()

    # --- Cleanup ---
    cleanup = input("Delete all created rules? (y/N): ")
    if cleanup.lower() == "y":
        for r in [rule1, rule2, rule3, rule4]:
            rid = r.get("id")
            if rid:
                delete_rule(rid)
                print(f"  Deleted rule {rid}")
    print("Done.")


if __name__ == "__main__":
    main()
