/**
 * AgentWatch TypeScript Example — Streaming with Budget Enforcement
 *
 * This example demonstrates streaming responses through AgentWatch with
 * real-time budget enforcement. If the budget is exceeded mid-stream,
 * the proxy terminates the response.
 *
 * Requirements:
 *     npm install openai
 *
 * Environment:
 *     export AGENTWATCH_KEY="aw_live_your_token"
 *     export OPENAI_KEY="sk-proj-your-key"
 */

import OpenAI from "openai";

const AGENTWATCH_KEY = process.env.AGENTWATCH_KEY || "aw_live_your_token";
const OPENAI_KEY = process.env.OPENAI_KEY || "sk-proj-your-key";
const AGENTWATCH_URL = process.env.AGENTWATCH_URL || "http://localhost:8787";

async function main() {
  const client = new OpenAI({
    baseURL: `${AGENTWATCH_URL}/v1/proxy/openai`,
    apiKey: `${AGENTWATCH_KEY}:${OPENAI_KEY}`,
  });

  console.log("--- Streaming with Budget Enforcement ---\n");
  console.log("Budget: $0.05 (deliberately low to demonstrate cutoff)\n");

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content:
          "Write a detailed essay about the history of computing from the 1940s to today. Include major milestones, key figures, and the evolution of programming languages.",
      },
    ],
    stream: true,
    headers: {
      "x-agentwatch-session-id": "stream-ts-example",
      "x-agentwatch-budget-usd": "0.05",
    },
  });

  let tokenCount = 0;
  let buffer = "";

  process.stdout.write("Response: ");

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      buffer += content;
      tokenCount++;
      process.stdout.write(content);

      // Print stats every 100 tokens
      if (tokenCount % 100 === 0) {
        process.stdout.write(`\n[${tokenCount} tokens streamed] `);
      }
    }

    // Check for budget-exceeded termination
    if (chunk.choices[0]?.finish_reason === "length") {
      console.log("\n\n⚠ Stream terminated: budget exceeded mid-generation.");
      console.log(`  Tokens streamed: ~${tokenCount}`);
      console.log("  The proxy stopped forwarding tokens to protect your budget.");
      break;
    }
  }

  console.log(`\n\nTotal chunks received: ~${tokenCount}`);
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
