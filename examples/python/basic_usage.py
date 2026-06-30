"""
AgentWatch Python Example — Basic Usage

This example demonstrates:
1. Setting up the AgentWatch proxy
2. Enforcing a session budget
3. Making API calls through the proxy

Requirements:
    pip install openai

Environment:
    Set your AgentWatch API key and OpenAI key:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
"""

from openai import OpenAI

# Combine your AgentWatch token with your OpenAI key
AGENTWATCH_KEY = "aw_live_your_token"
OPENAI_KEY = "sk-proj-your-key"

client = OpenAI(
    base_url="http://localhost:8787/v1/proxy/openai",
    api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
)

# Set a session budget of $2.00
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello, world!"}],
    extra_headers={
        "x-agentwatch-session-id": "my-session-123",
        "x-agentwatch-budget-usd": "2.00",
    },
)

print(response.choices[0].message.content)
