"""
AgentWatch Python Example — LangChain Integration

This example demonstrates how to integrate AgentWatch with LangChain.
AgentWatch acts as a transparent proxy — just point LangChain's LLM
base_url to AgentWatch instead of the provider directly.

Requirements:
    pip install langchain langchain-openai

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
"""

import os

from langchain_openai import ChatOpenAI

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
OPENAI_KEY = os.environ.get("OPENAI_KEY", "sk-proj-your-key")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")


def main():
    # --- Basic LangChain usage with AgentWatch ---
    # Point the LLM to AgentWatch's proxy URL.
    # The API key combines your AgentWatch token and provider key.
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
        default_headers={
            "x-agentwatch-session-id": "langchain-session-001",
            "x-agentwatch-budget-usd": "1.00",
        },
    )

    # --- Simple chat ---
    print("--- LangChain + AgentWatch ---\n")
    response = llm.invoke("What are the three laws of robotics?")
    print(f"Response: {response.content}\n")

    # --- Chain with budget enforcement ---
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful coding assistant."),
        ("user", "{question}"),
    ])

    chain = prompt | llm | StrOutputParser()

    print("--- Chain with Budget ---\n")
    result = chain.invoke({"question": "Write a Python hello world program."})
    print(f"Result: {result}\n")

    # --- Multiple calls sharing a session ---
    # All calls with the same session ID share a budget.
    # Once the session budget is exhausted, subsequent calls are blocked.
    SHARED_SESSION = "langchain-shared-session"

    shared_llm = ChatOpenAI(
        model="gpt-4o-mini",
        base_url=f"{AGENTWATCH_URL}/v1/proxy/openai",
        api_key=f"{AGENTWATCH_KEY}:{OPENAI_KEY}",
        default_headers={
            "x-agentwatch-session-id": SHARED_SESSION,
            "x-agentwatch-budget-usd": "0.25",
        },
    )

    print("--- Shared Session Budget ---\n")
    for i, question in enumerate(["What is Python?", "What is Rust?", "What is Go?"]):
        try:
            response = shared_llm.invoke(question)
            print(f"  [{i + 1}] {response.content[:80]}...")
        except Exception as e:
            print(f"  [{i + 1}] Blocked: {e}")
            break


if __name__ == "__main__":
    main()
