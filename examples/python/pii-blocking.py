"""
AgentWatch Python Example — PII Detection and Blocking

This example demonstrates how to detect and block personally identifiable
information (PII) from being sent through the AgentWatch proxy.

AgentWatch supports custom rules that can flag or block requests containing
patterns matching PII (emails, SSNs, credit cards, etc.).

Requirements:
    pip install openai requests

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
    export ADMIN_SECRET="your_admin_secret"
"""

import os
import re
import sys

import requests
from openai import OpenAI

# --- Configuration ---
AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
OPENAI_KEY = os.environ.get("OPENAI_KEY", "sk-proj-your-key")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "your_admin_secret")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")

# Common PII patterns
PII_PATTERNS = {
    "email": re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"),
    "phone": re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"),
}


def check_for_pii(text: str) -> dict:
    """Scan text for common PII patterns."""
    findings = {}
    for pii_type, pattern in PII_PATTERNS.items():
        matches = pattern.findall(text)
        if matches:
            findings[pii_type] = matches
    return findings


def create_pii_blocking_rule(api_key: str, admin_secret: str) -> dict:
    """Create a custom AgentWatch rule to block PII at the proxy level."""
    rule = {
        "name": "block-pii-emails",
        "enabled": True,
        "priority": 300,
        "condition": {"prompt_tokens_min": 100},
        "action": "alert",
        "action_config": {
            "message": "Potential PII detected in request. Review before proceeding.",
            "tag": "pii-flag",
        },
    }
    resp = requests.post(
        f"{AGENTWATCH_URL}/v1/rules",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=rule,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def main():
    # --- Step 1: Pre-flight client-side PII check ---
    user_input = input("Enter a message to send to the AI: ")

    print("\n--- Client-Side PII Check ---")
    pii_found = check_for_pii(user_input)
    if pii_found:
        print("⚠ PII detected before sending:")
        for pii_type, matches in pii_found.items():
            print(f"  {pii_type}: {matches}")
        print("\nBlocking request to protect sensitive data.")
        sys.exit(1)
    print("  No PII detected ✓")

    # --- Step 2: Send request through AgentWatch proxy ---
    print("\n--- Sending through AgentWatch Proxy ---")
    client = OpenAI(
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": user_input}],
            extra_headers={
                "x-agentwatch-session-id": "pii-example-session",
                "x-agentwatch-budget-usd": "0.50",
            },
        )
        print(f"\nResponse: {response.choices[0].message.content}")
    except Exception as e:
        print(f"\nRequest blocked: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
