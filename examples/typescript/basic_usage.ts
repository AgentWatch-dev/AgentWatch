/**
 * AgentWatch TypeScript Example — Basic Usage
 *
 * This example demonstrates:
 * 1. Setting up the AgentWatch proxy
 * 2. Enforcing a session budget
 * 3. Making API calls through the proxy
 *
 * Requirements:
 *     npm install openai
 *
 * Environment:
 *     Set your AgentWatch API key and OpenAI key:
 *     export AGENTWATCH_KEY="aw_live_your_token"
 *     export OPENAI_KEY="sk-proj-your-key"
 */

import OpenAI from "openai";

const AGENTWATCH_KEY = process.env.AGENTWATCH_KEY || "aw_live_your_token";
const OPENAI_KEY = process.env.OPENAI_KEY || "sk-proj-your-key";
const AGENTWATCH_URL = process.env.AGENTWATCH_URL || "http://localhost:8787";

const client = new OpenAI({
  baseURL: `${AGENTWATCH_URL}/v1/proxy/openai`,
  apiKey: `${AGENTWATCH_KEY}:${OPENAI_KEY}`,
});

// Set a session budget of $2.00
const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello, world!" }],
  headers: {
    "x-agentwatch-session-id": "my-session-123",
    "x-agentwatch-budget-usd": "2.00",
  },
});

console.log(response.choices[0].message.content);
