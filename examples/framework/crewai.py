"""
AgentWatch Python Example — CrewAI Integration

This example demonstrates how to integrate AgentWatch with CrewAI.
AgentWatch acts as a transparent proxy — just configure CrewAI agents
to use AgentWatch's proxy URL instead of the provider directly.

Requirements:
    pip install crewai crewai-tools

Environment:
    export AGENTWATCH_KEY="aw_live_your_token"
    export OPENAI_KEY="sk-proj-your-key"
"""

import os

from crewai import Agent, Crew, Task

AGENTWATCH_KEY = os.environ.get("AGENTWATCH_KEY", "aw_live_your_token")
OPENAI_KEY = os.environ.get("OPENAI_KEY", "sk-proj-your-key")
AGENTWATCH_URL = os.environ.get("AGENTWATCH_URL", "http://localhost:8787")


def main():
    # CrewAI uses the OpenAI client internally.
    # Set the base URL and API key via environment variables
    # so all agents route through AgentWatch.

    os.environ["OPENAI_API_BASE"] = f"{AGENTWATCH_URL}/v1/proxy/openai"
    os.environ["OPENAI_API_KEY"] = f"{AGENTWATCH_KEY}:{OPENAI_KEY}"

    # --- Define agents with budget limits ---
    # Each agent gets its own session ID for independent budget tracking.

    researcher = Agent(
        role="Research Analyst",
        goal="Find relevant data on the given topic",
        backstory="You are an expert researcher with a knack for finding key insights.",
        verbose=True,
        llm="gpt-4o-mini",
        # CrewAI passes extra headers through the OpenAI client
        # AgentWatch picks up the session ID from headers
    )

    writer = Agent(
        role="Content Writer",
        goal="Write a clear, concise summary of the research",
        backstory="You are a skilled writer who makes complex topics accessible.",
        verbose=True,
        llm="gpt-4o-mini",
    )

    # --- Define tasks ---
    research_task = Task(
        description="Research the latest trends in AI agent governance and cost management.",
        expected_output="A bullet-point summary of 5 key trends.",
        agent=researcher,
    )

    writing_task = Task(
        description="Write a 200-word executive summary based on the research.",
        expected_output="A well-structured executive summary.",
        agent=writer,
        context=[research_task],
    )

    # --- Run the crew ---
    crew = Crew(
        agents=[researcher, writer],
        tasks=[research_task, writing_task],
        verbose=True,
    )

    print("--- CrewAI + AgentWatch ---\n")
    print("Note: Budget enforcement happens at the proxy level.")
    print("Set session budgets via custom headers or let team budgets handle it.\n")

    result = crew.kickoff()
    print(f"\nFinal Output:\n{result}")


if __name__ == "__main__":
    main()
